/* Maniaa Print — script.js
   Frontend handlers and upload stubs. Wire to your backend endpoints:
   - POST /upload  (multipart/form-data) -> fields: email, material, file
   - POST /quote   (application/json) -> { name, email, subject, message }
*/

document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const uploadFile = document.getElementById('uploadFile');
  const uploadProgress = document.getElementById('uploadProgress');
  const uploadPercent = document.getElementById('uploadPercent');

  const contactForm = document.getElementById('contactForm');

  if (uploadForm) uploadForm.addEventListener('submit', handleUpload);
  if (contactForm) contactForm.addEventListener('submit', handleContact);

  function handleUpload(e){
    e.preventDefault();
    const email = document.getElementById('uploadEmail').value;
    const material = document.getElementById('uploadMaterial').value;
    const fileInput = uploadFile;

    if (!email) return alert('Please enter your email');
    if (!fileInput.files || fileInput.files.length === 0) return alert('Please attach an STL or OBJ file');

    const file = fileInput.files[0];
    // Basic client-side validation
    const allowed = ['stl','obj'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) return alert('Unsupported file type. Use STL or OBJ.');

    // Prepare form data
    const fd = new FormData();
    fd.append('email', email);
    fd.append('material', material);
    fd.append('file', file);

    // Show progress UI
    uploadProgress.style.display = 'block';
    uploadPercent.textContent = '0%';

    // Use XHR to get upload progress events
    const xhr = new XMLHttpRequest();
    // TODO: change this to your actual upload endpoint
    const uploadUrl = '/upload';

    xhr.open('POST', uploadUrl, true);

    xhr.upload.onprogress = function(event){
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        uploadPercent.textContent = percent + '%';
      }
    };

    xhr.onload = function(){
      uploadProgress.style.display = 'none';
      if (xhr.status >= 200 && xhr.status < 300){
        try{
          const res = JSON.parse(xhr.responseText);
          alert('Upload sent — we will email your quote.\nReference: ' + (res.reference || 'n/a'));
          uploadForm.reset();
        }catch(err){
          alert('Upload finished — server responded. Check console for details.');
          console.log('upload response:', xhr.responseText);
        }
      } else {
        console.error('upload failed', xhr.status, xhr.responseText);
        // Fallback to mailto as a last resort
        const fallback = confirm('Upload failed (status '+xhr.status+'). Do you want to open your mail client to send the request manually?');
        if (fallback) {
          const subject = encodeURIComponent('Mania Print — file upload failed');
          const body = encodeURIComponent('Email: '+email+'\nMaterial: '+material+'\nFile: '+file.name+'\n\n(Attach file manually to this email)');
          window.location.href = 'mailto:hello@maniaprint.com?subject='+subject+'&body='+body;
        }
      }
    };

    xhr.onerror = function(){
      uploadProgress.style.display = 'none';
      alert('Network error while uploading. Check your connection and try again.');
    };

    xhr.send(fd);
  }

  async function handleContact(e){
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('subject').value || 'Quote Request';
    const message = document.getElementById('message').value || '';

    if (!name || !email) return alert('Please provide your name and email.');

    const payload = { name, email, subject, message };

    try{
      // TODO: change to your quote endpoint
      const res = await fetch('/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok){
        const data = await res.json().catch(()=>({}));
        alert('Message sent. We will reply to ' + email + '. Reference: ' + (data.reference || 'n/a'));
        contactForm.reset();
      } else {
        console.error('quote failed', res.status);
        alert('Failed to send message. Opening mail client as fallback.');
        const body = encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+message);
        window.location.href = 'mailto:hello@maniaprint.com?subject='+encodeURIComponent(subject)+'&body='+body;
      }
    }catch(err){
      console.error('contact error', err);
      alert('Network error. Opening mail client as fallback.');
      const body = encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+message);
      window.location.href = 'mailto:hello@maniaprint.com?subject='+encodeURIComponent(subject)+'&body='+body;
    }
  }

});