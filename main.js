// Delta Mapping and Drone — main.js

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Sticky header shadow on scroll
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    header.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
  } else {
    header.style.boxShadow = 'none';
  }
}, { passive: true });

// Contact form submission
const form = document.getElementById('contactForm');
const status = document.getElementById('form-status');

if (form) {
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    status.className = 'form-status';
    status.textContent = '';

    const data = {
      name:    form.name.value.trim(),
      phone:   form.phone.value.trim(),
      email:   form.email.value.trim(),
      acres:   form.acres.value.trim(),
      message: form.message.value.trim(),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        status.className = 'form-status success';
        status.textContent = 'Message sent. We will be in touch.';
        form.reset();
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = 'Something went wrong. Email us directly at houston.chip@protonmail.com';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send →';
    }
  });
}
