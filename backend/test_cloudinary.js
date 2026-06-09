import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: ' drd6brkpt'.trim(), // trying with and without trim to see if that's the issue
  api_key: '155189361188559',
  api_secret: 'H92BkrQTAas1R-k40_Vccfqk0kw',
});

async function test() {
  try {
    const res = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', {
      folder: 'astrotalk_test'
    });
    console.log('Success:', res.secure_url);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
