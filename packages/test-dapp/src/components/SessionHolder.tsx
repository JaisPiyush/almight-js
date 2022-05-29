import React from "react"
import {ListGroupItem} from "react-bootstrap"


interface SessionHolderInterface {
    header: string;
    text: string;
    footer: string;
    session: any
    onClick: (data: any) => void;
}

export default function SessionHolder(props: SessionHolderInterface) {
    return <ListGroupItem
    as="div"
    className="w-full h-auto hover:bg-orange-50 "
    onClick={() => {props.onClick(props.session)}}
>
    <div className="flex flex-row justify-between ">
        <div className="flex">
            <img src={props.header} className="w-12" alt="banner" />
            <p className="ml-4 self-center text-2xl font-bold">{props.text}</p>
        </div>

        <img src={props.footer} className="w-8 h-10" alt="banner" />
    </div>


</ListGroupItem>
}