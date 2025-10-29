
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';
let sheetsClient = null;

function ensureClient() {
  if (!SPREADSHEET_ID) return null;
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

export async function readSheet(a1Range) {
  const client = ensureClient();
  if (!client) return [];
  const { data } = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: a1Range
  });
  return data.values || [];
}

export async function readSheetRange(sheet, range) {
  return readSheet(`${sheet}!${range}`);
}

export async function appendToSheet(sheetName, row) {
  const client = ensureClient();
  if (!client) return true;
  await client.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] }
  });
  return true;
}

export async function updateRow(rowNumber, rowValues, sheetName = (process.env.ACTIVITIES_SHEET || 'Activities')) {
  const client = ensureClient();
  if (!client) return true;
  const endColIndex = 64 + Math.max(1, rowValues.length);
  const endCol = String.fromCharCode(minZ(endColIndex));
  const range = `${sheetName}!A${rowNumber}:${endCol}${rowNumber}`;
  await client.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [rowValues] }
  });
  return true;
}
function minZ(i){ return Math.min(90, i); }
