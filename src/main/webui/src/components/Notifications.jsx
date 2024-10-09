import { Alert, AlertActionCloseButton, AlertGroup, AlertVariant } from "@patternfly/react-core"

export const ToastNotifications = ({ alerts, onDeleteAlert }) => {

  return <AlertGroup isToast isLiveRegion>
    {alerts.map((alert, idx) =>
      <Alert
        variant={AlertVariant[alert.variant]}
        title={alert.title}
        timeout={true}
        actionClose={<AlertActionCloseButton
          title={alert.title}
          variantLabel={`${alert.variant}`}
          onClose={() => onDeleteAlert(idx)} />}
        key={idx}>{alert.content}</Alert>)}
  </AlertGroup>
}