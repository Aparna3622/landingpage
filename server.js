const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const port = Number(process.env.PORT) || 5500;
const root = __dirname;
const workbookPath = path.join(root, 'vinra-homeground-registrations.xlsx');
const fallbackWorkbookPath = path.join(root, 'vinra-homeground-registrations-live.xlsx');
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function appendRegistration(data, targetPath) {
  const workbook = fs.existsSync(targetPath)
    ? XLSX.readFile(targetPath)
    : XLSX.utils.book_new();
  const sheetName = workbook.SheetNames[0] || 'Registrations';
  const sheet = workbook.Sheets[sheetName] || XLSX.utils.aoa_to_sheet([
    ['S.No', 'Submitted at', 'Full name', 'Phone', 'Email', 'Interest', 'Message']
  ]);
  if (!workbook.SheetNames.includes(sheetName)) {
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const nextNumber = rows.length > 1 ? Number(rows[rows.length - 1][0]) + 1 : 1;
  XLSX.utils.sheet_add_aoa(sheet, [[
    nextNumber,
    data.submittedAt,
    data.name,
    data.phone,
    data.email,
    data.interest,
    data.message
  ]], { origin: -1 });

  XLSX.writeFile(workbook, targetPath);
}

function serveStatic(request, response) {
  const requestedPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const relativePath = requestedPath === '/' ? '/index.html' : requestedPath;
  const filePath = path.resolve(root, `.${relativePath}`);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/api/registrations') {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.name || !data.phone || !data.email || !data.interest) {
          sendJson(response, 400, { error: 'Please complete all required fields.' });
          return;
        }
        data.submittedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        try {
          appendRegistration(data, workbookPath);
        } catch (error) {
          if (error.code !== 'EBUSY' && error.code !== 'EPERM') throw error;
          appendRegistration(data, fallbackWorkbookPath);
        }
        sendJson(response, 201, { saved: true });
      } catch (error) {
        console.error('Could not save registration:', error);
        sendJson(response, 500, { error: 'The enquiry could not be saved. Please try again.' });
      }
    });
    return;
  }

  if (request.method === 'GET') {
    serveStatic(request, response);
    return;
  }

  response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Method not allowed');
});

server.listen(port, () => {
  console.log(`GEM Properties site running at http://localhost:${port}`);
});
