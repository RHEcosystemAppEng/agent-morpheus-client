export function formatLocalDateTime(input) {
  if (input === null || input === undefined || input === '') return '-';

  let value = input;
  if (typeof input === 'object' && input !== null) {
    if ('$date' in input) {
      value = input.$date;
    }
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return String(input);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', {
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });

  return `${day} ${month} ${year}, ${time}`;
} 