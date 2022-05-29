



export default function WalletAvatar(props: {src: string, provider: string, name: string, onClick: (provider: string) => void}){
    return (<div onClick={() => {props.onClick(props.provider)}} className="flex flex-col mx-2 my-4 px-2 pt-2 w-auto hover:bg-blue-600 rounded-md hover:text-white h-auto border border-black">
        <img src={props.src} className="w-12 h-16 mx-3 mb-2" />
        <p>{props.name}</p>
    </div>)
}