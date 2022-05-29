import { ServerSentIdentityProvider, UserData } from "@almight-sdk/auth";
import { ConnectorType } from "@almight-sdk/connector";
import { Providers } from "@almight-sdk/utils";
import { Accordion, Modal } from "react-bootstrap";
import { IdentityProviderData } from "../types";
import AccountAccordian from "./AccountAccordian";

interface SessionsModalProps {
    show?: boolean;
    onClose: () => void;
}

export function SessionsModal(props: SessionsModalProps) {

    const userData: UserData = {
        "user": {
            "user_id": "project_i7AERu3QigB-V-aqYDv9KcQETOd9BBQTa90hxS9e_vApn0JmPwFRlT56WVaYX1JhoUzYXck7ZySQgSJulGCB7lerFnrI2E6jHPu7XfETNZvo6fJJbqY-BkcdW",
            "project": "project_i7AERu3QigB-V-aqYDv9KcQETOd9BBQTa90hxS9e",
            "auth_app": 1,
            "is_active": true
        },
        "idps": [
            {
                "uid": "0xcf13e1a5dcfde85d6d77a17f837f33154e35bee1",
                "user": "project_i7AERu3QigB-V-aqYDv9KcQETOd9BBQTa90hxS9e_vApn0JmPwFRlT56WVaYX1JhoUzYXck7ZySQgSJulGCB7lerFnrI2E6jHPu7XfETNZvo6fJJbqY-BkcdW",
                "web_version": 3,
                "provider": "metamask",
                "meta_data": {
                    "sessions": {
                        "browser_extension": [
                            {
                                "path": "ethereum",
                                "chainId": 1
                            }
                        ]
                    }
                }
            }
        ]
    }


    function transformSessions(userData: UserData): IdentityProviderData[] {
        return userData.idps.map<IdentityProviderData>((idp: ServerSentIdentityProvider) => {
            const sessions: any[] = []
            if(idp.meta_data !== undefined && idp.meta_data.sessions !== undefined){
                for(const [_, ses] of Object.entries(idp.meta_data.sessions)){
                    sessions.concat(ses)
                }
            }
            return {
                uid: idp.uid,
                provider: idp.provider,
                sessions: sessions
            }
        })
    }


    const data: IdentityProviderData = {
        uid: " 0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        provider: Providers.MetaMask,
        sessions: [
            { path: "ethereum", chainId: 1 }
        ]
    }

    return <Modal
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
            <Accordion>
                <AccountAccordian data={data} ></AccountAccordian>
            </Accordion>
        </Modal.Body>
    </Modal>
}