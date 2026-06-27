import { Metadata } from 'next';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Rebelly\'s Flower Shop | Saydeh Street, Zalka',
  description: 'Call, WhatsApp, or visit Rebelly\'s Flower Shop on Saydeh Street in Zalka, Lebanon. Open Monday to Saturday, 9:30 AM to 7:30 PM.',
  alternates: {
    canonical: 'https://rebellys.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div style={{ padding: '6rem var(--px) 8rem', background: 'var(--cream)', minHeight: '100vh' }}>
      <section className="container" aria-label="Contact Us">
        <div className="section-header" data-animate="fadeUp">
          <span className="section-tag">Find Us</span>
          <h1 className="section-title">Come Say<br/><em>Hello 🌸</em></h1>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'start' }}>
          
          <div data-animate="fadeLeft" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="card" style={{ padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden="true">📍</div>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.5rem' }}>Address</strong>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Saydeh Street, Zalka<br/>Mount Lebanon, Lebanon</p>
                <a href="https://maps.app.goo.gl/aq7CZ26re22c4KQx7" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rose-500)', fontWeight: 600 }}>Get Directions →</a>
              </div>
            </div>
            
            <div className="card" style={{ padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden="true">📞</div>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.5rem' }}>Phone</strong>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>+961 76 585 028</p>
                <a href="tel:+96176585028" style={{ color: 'var(--rose-500)', fontWeight: 600 }}>Call Now →</a>
              </div>
            </div>
            
            <div className="card" style={{ padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden="true">💬</div>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.5rem' }}>WhatsApp</strong>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Quick orders &amp; inquiries</p>
                <a href="https://wa.me/96176585028" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 600 }}>Message Us →</a>
              </div>
            </div>

            <div className="card" style={{ padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden="true">🕐</div>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.5rem' }}>Opening Hours</strong>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Monday – Saturday: 9:30 AM – 7:30 PM</p>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Sunday: Closed</p>
              </div>
            </div>

          </div>
          
          <div data-animate="fadeRight" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ padding: '2rem', background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(45,10,30,0.05)' }}>
              <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.8rem', marginBottom: '1.5rem' }}>Send a Message</h2>
              <ContactForm />
            </div>

            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', height: '400px', position: 'relative' }}>
              <iframe
                title="Rebelly's Flower Shop location on Google Maps"
                src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=Rebelly's%20Flower%20Shop,%20Saydeh%20Street,%20Zalka,%20Lebanon+(Rebelly's%20Flower%20Shop)&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                style={{ width: '100%', height: '100%', border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade">
              </iframe>
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}
