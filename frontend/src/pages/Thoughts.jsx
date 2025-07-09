import React from 'react';
import './Thoughts.css'; // Import the CSS for this page

// Images are expected in public/images/

const Thoughts = () => (
  <div className="thoughts-container">
    <h1>Bandwidth Salon 💭</h1>
    <p className="thoughts-intro">
      Hi this is Saloni, I created this page to share my thoughts behind building Bandwidth Salon. Imagine this: you’re leading a crucial video call, everything’s going perfectly… and then your Wi-Fi drops
    </p>
    <div className="thoughts-screenshots-row">
      <figure className="thoughts-figure">
        {/* connection-error.png */}
        <img src="/images/connection-error.png" alt="Sorry, an unexpected error occurred." />
      </figure>
      <figure className="thoughts-figure">
        {/* payment-form-error.png */}
        <img src="/images/payment-form-error.png" alt="There was an issue loading the credit card form." />
      </figure>
    </div>
    <p className="thoughts-followup">
      This happened to me, two different Wi-Fi accounts, two red banners of doom, zero mercy. If only I’d seen the drop coming, I could’ve dodged the awkward silence.
    </p>
    <h2>Why I Built Bandwidth Salon</h2>
    <p>
      Meet <strong>Bandwidth Salon</strong>: your real-time internet watchdog. Every second, it checks your upload and download speeds, watches for multi-second drops, and gives you a 5 minute heads up before things go south. Perfect for:
    </p>
    <ul>
      <li>Acing online exams or interviews</li>
      <li>Presenting or leading important video calls</li>
      <li>Staying connected when it matters most</li>
    </ul>
    <h2>Why It Matters</h2>
    <p>
      A little warning can save your day. Here’s what you can do with a heads-up:
    </p>
    <ul>
      <li>Switch to a hotspot before disaster strikes</li>
      <li>Alert your ISP before your meeting tanks</li>
      <li>Blame Mercury retrograde (instead of your code)</li>
    </ul>
    <p className="thoughts-closing">
      Ready to turn your Wi-Fi from a buffering, audio-chopping headache into a packet-pushing powerhouse?
      <br /><br />
      Let’s make your network the envy of every router with pure bandwidth brilliance (and maybe a coffee)
    </p>
    {/*
      To wire this page into your app’s navigation:
      1. Add a route in your router (e.g., React Router) for /thoughts → <Thoughts />
      2. Add a link to Thoughts in your navigation menu or dashboard
    */}
  </div>
);

export default Thoughts; 