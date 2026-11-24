import { SHOP, whatsappHref } from '@/lib/shop';
import Icon from './icons/Icon';
import styles from './WhatsAppButton.module.css';

const MESSAGE = "Hi Rebelly's, I'd like to place an order";

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappHref(MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.btn}
      aria-label={`Chat with ${SHOP.name} on WhatsApp`}
    >
      <Icon name="whatsapp" size={18} className={styles.icon} />
      <span className={styles.label}>WhatsApp</span>
    </a>
  );
}
