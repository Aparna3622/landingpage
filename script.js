const form = document.getElementById('registrationForm');
const status = document.getElementById('formStatus');
const storageKey = 'vinra-homeground-registrations';

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.submittedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const registrations = JSON.parse(localStorage.getItem(storageKey) || '[]');
  registrations.push(data);
  localStorage.setItem(storageKey, JSON.stringify(registrations));

  const rows = registrations.map((entry, index) => ({
    'S.No': index + 1,
    'Submitted at': entry.submittedAt,
    'Full name': entry.name,
    'Phone': entry.phone,
    'Email': entry.email,
    'Interest': entry.interest,
    'Message': entry.message || ''
  }));

  if (typeof XLSX !== 'undefined') {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 7 }, { wch: 23 }, { wch: 24 }, { wch: 17 }, { wch: 30 }, { wch: 25 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    XLSX.writeFile(workbook, 'vinra-homeground-registrations.xlsx');
  } else {
    const headings = Object.keys(rows[0]);
    const csv = [headings, ...rows.map((row) => headings.map((heading) => row[heading]))]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'vinra-homeground-registrations.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  status.textContent = 'Thank you. Your details are saved and the registrations Excel file is downloading.';
  status.style.color = '#526d21';
  form.reset();
});
