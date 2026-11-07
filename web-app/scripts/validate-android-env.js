const apiUrl = process.env.VITE_API_URL;

if (!apiUrl) {
  console.error('Set VITE_API_URL to the public HTTPS address of the API before building the Android app.');
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(apiUrl);
} catch {
  console.error('VITE_API_URL must be a valid HTTPS URL.');
  process.exit(1);
}

if (parsedUrl.protocol !== 'https:') {
  console.error('VITE_API_URL must use HTTPS for an installable Android app.');
  process.exit(1);
}

console.log(`Building Android app for API ${parsedUrl.origin}`);
