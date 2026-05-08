import { createPortal } from 'react-dom';

export default function Toast({ msg, show }) {
  return createPortal(<div className={`toast ${show ? 'show' : ''}`}>{msg}</div>, document.body);
}
