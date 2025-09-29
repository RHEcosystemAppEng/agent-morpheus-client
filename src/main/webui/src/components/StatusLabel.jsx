import { Label } from "@patternfly/react-core"
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import OutlinedClockIcon from '@patternfly/react-icons/dist/esm/icons/outlined-clock-icon';

export const StatusLabel = ({type, size = "default"}) => {
  const msg = String(type).charAt(0).toUpperCase() + String(type).slice(1);
  const style = size === "large" ? { fontSize: '16px', padding: '8px 12px' } : {};
  
  switch (type) {
    case "completed": return <Label variant="outline" status="success" style={style}>{msg}</Label>;
    case "failed": return <Label variant="outline" status="danger" style={style}>{msg}</Label>
    case "queued": return <Label variant="outline" icon={<InfoCircleIcon />} color="yellow" style={style}>{msg}</Label>
    case "sent": return <Label variant="outline" status="info" style={style}>{msg}</Label>
    case "expired": return <Label variant="outline" color="purple" icon={<OutlinedClockIcon />} style={style}>{msg}</Label>;
    case "pending": return <Label variant="outline" color="teal" icon={<OutlinedClockIcon />} style={style}>{msg}</Label>
    case "analysing": return <Label variant="outline" color="yellow" icon={<OutlinedClockIcon />} style={style}>{msg}</Label>
    default: return <Label variant="outline" color="grey" style={style}>{msg}</Label>
  }
  
}