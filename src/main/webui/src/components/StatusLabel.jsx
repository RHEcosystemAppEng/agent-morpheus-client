import { Label } from "@patternfly/react-core"
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import OutlinedClockIcon from '@patternfly/react-icons/dist/esm/icons/outlined-clock-icon';

export const StatusLabel = ({type, size = "default"}) => {
  const msg = String(type).charAt(0).toUpperCase() + String(type).slice(1);
  const style = size === "large" ? { fontSize: '16px', padding: '8px 12px' } : {};
  
  switch (type) {
    case "completed": return <Label status="success" style={style}>{msg}</Label>;
    case "failed": return <Label status="danger" style={style}>{msg}</Label>
    case "queued": return <Label icon={<InfoCircleIcon />} color="yellow" style={style}>{msg}</Label>
    case "sent": return <Label status="info" style={style}>{msg}</Label>
    case "expired": return <Label color="purple" icon={<OutlinedClockIcon />} style={style}>{msg}</Label>;
    case "pending": return <Label color="teal" icon={<OutlinedClockIcon />} style={style}>{msg}</Label>
    case "analysing": return <Label color="yellow" icon={<OutlinedClockIcon />} style={style}>{msg}</Label>
    default: return <Label color="grey" style={style}>{msg}</Label>
  }
  
}