import { Button, Modal, ModalVariant } from "@patternfly/react-core";

export const ConfirmationButton = ({ btnVariant, onConfirm, children, message }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const onClick = () => {
    setIsOpen(true);
  };

  const onCloseConfirmation = () => {
    setIsOpen(false);
  };

  return <>
    <Button variant={btnVariant} onClick={() => onClick()}>{children}</Button>
    <Modal variant={ModalVariant.small} title="Are you sure?" isOpen={isOpen}
      onClose={onCloseConfirmation}
      actions={[<Button key="confirm" variant={btnVariant} onClick={onConfirm}>{children}</Button>,
      <Button key="close" variant="link" onClick={onCloseConfirmation}>Close</Button>]}
    >
      {message}
    </Modal>
  </>
}