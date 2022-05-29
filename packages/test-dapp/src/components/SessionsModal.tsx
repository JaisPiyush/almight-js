import { Modal } from "react-bootstrap";

interface SessionsModalProps {
    show?: boolean;
    onClose: () => void;
}

export function SessionsModal(props: SessionsModalProps) {
    return  <Modal
    backdrop="static"
    show={props.show ?? false}
    centered
    onHide={props.onClose}
    size="lg"
>
    <Modal.Header closeButton>
        <Modal.Title>Accounts</Modal.Title>
    </Modal.Header>
    <Modal.Body as="div">
        
    </Modal.Body>
</Modal>
}