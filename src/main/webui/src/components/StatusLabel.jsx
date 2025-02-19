import { Label } from "@patternfly/react-core"
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

export const StatusLabel = ({type}) => {
  const msg = String(type).charAt(0).toUpperCase() + String(type).slice(1);
  switch (type) {
    case "completed": return <Label status="success">{msg}</Label>;
    case "failed": return <Label status="danger">{msg}</Label>
    case "queued": return <Label icon={<InfoCircleIcon />} color="yellow">{msg}</Label>
    case "sent": return <Label status="info">{msg}</Label>
    default: return <Label color="grey">{msg}</Label>
  }
  
}