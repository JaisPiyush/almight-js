import React, { useState } from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"

export default function ActionsBox() {
    const [balance, setBalance] = useState<number>(0);
    return (
        <div className="w-full h-full flex flex-col">
            <div className="w-full flex flex-row">
                <p>Actions</p>
            </div>
            <div>
                <ListGroup>
                    <ListGroupItem as="div" className="flex flex-row justify-between">
                        <p className="w-auto">{balance}</p>
                        <button className="bg-blue-500 font-bold text-white px-4 py-2 rounded-sm">Get Balance</button>
                    </ListGroupItem>
                </ListGroup>

            </div>
        </div>
    )
}