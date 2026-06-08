export const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // the hour '0' should be '12'
  const hStr = h < 10 ? '0' + h : h;
  return `${hStr}:${minutes} ${ampm}`;
};
