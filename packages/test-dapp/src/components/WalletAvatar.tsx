



export default function WalletAvatar(props: {src: string, provider: string, name: string, onClick: (provider: string) => void}){
    return (<div onClick={() => {props.onClick(props.provider)}} className="flex flex-col mx-2 my-4 px-2 pt-2 w-auto hover:bg-blue-600 rounded-md hover:text-white h-auto">
        <img src={props.src} className="w-16 overflow-hidden rounded-full self-center" alt={`${props.provider}'s icon`} />
        <p className="font-heebo text-sm mt-2">{props.name}</p>
    </div>)
}