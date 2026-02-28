import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// .env.local を読み込み（dotenv未使用の軽量実装）
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// 環境変数から認証情報を取得
const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT;
const serviceAccountFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE; // 追加: ファイルパス指定
const sheetsId = process.env.GOOGLE_SHEETS_ID;

if (!serviceAccountKey && !serviceAccountFile) {
  console.error('❌ GOOGLE_SERVICE_ACCOUNT または GOOGLE_SERVICE_ACCOUNT_FILE が設定されていません');
  process.exit(1);
}

if (!sheetsId) {
  console.error('❌ GOOGLE_SHEETS_ID 環境変数が設定されていません');
  process.exit(1);
}

try {
  // サービスアカウントキーをパース
  let serviceAccountRaw = null;
  if (serviceAccountFile) {
    const abs = path.isAbsolute(serviceAccountFile) ? serviceAccountFile : path.resolve(process.cwd(), serviceAccountFile);
    serviceAccountRaw = fs.readFileSync(abs, 'utf-8');
  } else {
    serviceAccountRaw = serviceAccountKey;
  }

  // いくつかの入力形式に対応:
  // 1) 素のJSON文字列
  // 2) \n を含むJSON文字列（.envで改行をエスケープ）
  // 3) BASE64エンコード文字列
  let parsed = null;
  const tryParsers = [
    () => JSON.parse(serviceAccountRaw),
    () => JSON.parse(serviceAccountRaw.replace(/\\n/g, '\n')),
    () => JSON.parse(Buffer.from(serviceAccountRaw, 'base64').toString('utf8')),
  ];
  for (const fn of tryParsers) {
    try {
      parsed = fn();
      break;
    } catch {}
  }
  if (!parsed) {
    throw new Error('サービスアカウントJSONのパースに失敗しました。GOOGLE_SERVICE_ACCOUNTの形式（JSON/BASE64/\\n含み）または GOOGLE_SERVICE_ACCOUNT_FILE を確認してください。');
  }
  const serviceAccount = parsed;
  console.log('✅ サービスアカウントキーを正常にパースしました');
  console.log(`📧 サービスアカウント: ${serviceAccount.client_email}`);
  
  // Google Sheets APIクライアントを初期化
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  console.log('✅ Google Sheets APIクライアントを初期化しました');
  
  // スプレッドシートの基本情報を取得
  console.log(`📊 スプレッドシートID: ${sheetsId}`);
  console.log('🔍 スプレッドシートの基本情報を取得中...');
  
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetsId
  });
  
  console.log('✅ スプレッドシートにアクセスできました！');
  console.log(`📋 タイトル: ${spreadsheet.data.properties.title}`);
  console.log(`📄 シート数: ${spreadsheet.data.sheets.length}`);
  
  // 各シートの情報を表示
  spreadsheet.data.sheets.forEach((sheet, index) => {
    console.log(`  ${index + 1}. ${sheet.properties.title} (ID: ${sheet.properties.sheetId})`);
  });
  
  // 最初のシートのデータを取得してみる
  if (spreadsheet.data.sheets.length > 0) {
    const firstSheet = spreadsheet.data.sheets[0];
    const sheetName = firstSheet.properties.title;
    
    console.log(`\n🔍 シート "${sheetName}" のデータを取得中...`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetsId,
      range: `${sheetName}!A1:Z100` // 最初の100行を取得
    });
    
    const values = response.data.values;
    if (values && values.length > 0) {
      console.log('✅ データを正常に取得できました！');
      console.log(`📊 行数: ${values.length}`);
      console.log(`📊 列数: ${values[0].length}`);
      
      // 最初の5行を表示
      console.log('\n📋 最初の5行のデータ:');
      values.slice(0, 5).forEach((row, index) => {
        console.log(`  ${index + 1}: ${row.join(' | ')}`);
      });
    } else {
      console.log('⚠️  データが見つかりませんでした');
    }
  }
  
  console.log('\n🎉 すべてのテストが成功しました！');
  
} catch (error) {
  console.error('❌ エラーが発生しました:');
  console.error(error.message);
  
  if (error.code === 403) {
    console.error('\n🔧 解決方法:');
    console.error('1. サービスアカウントのJSONキーが正しいか確認');
    console.error('2. スプレッドシートにサービスアカウントのメールアドレスを共有');
    console.error('3. 共有権限は「編集者」に設定');
    console.error('4. Google Sheets APIが有効になっているか確認');
  } else if (error.code === 404) {
    console.error('\n🔧 解決方法:');
    console.error('1. スプレッドシートIDが正しいか確認');
    console.error('2. スプレッドシートが存在するか確認');
  }
  
  process.exit(1);
}
