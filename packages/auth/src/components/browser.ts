import { ConnectorModalData, IConnectorModal } from "../types";

export class WebConnectorModal implements IConnectorModal {

    el?: HTMLDivElement;
    readonly id = "almight__authentication_dialog"
    onConnectClick?: () => void;

    html(data: ConnectorModalData): string {
        return `
        <div class="almight__connector_modal">
        <style>
            ${this.css(data)}
        </style>
        <div class="almight__modal-content">
         <div class="almight__inner-conent">
            <div class="almight__header">
            <button onclick="handleCloseClick()" class="almight__close-button">
            <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Close</title><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144M368 144L144 368"/></svg>
            </button>
               
            </div>
            <div class="almight__banner">
                <div class="almight__banner_child">
                    <img class="almight__avatar" src="${data.icon}" alt="icon" />
                    <p class="almight__font-koulen">${data.provider}</p>
                </div>
            </div>
            <div class="almight__qr-box">
                <canvas  id="almight__qrcode"></canvas>
            </div>

            <div class="almight__btn-holder">
                <buttton onclick="handleConnectClick()" class="almight__connect">${data.buttonText}</buttton>
            </div>


            </div>
        </div>
        <script src="https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js"></script>
        <script>


        function handleCloseClick() {
            const event = new CustomEvent("almight-modal-close-click");
            document.dispatchEvent(event);
        }

        function handleConnectClick() {
            const event = new CustomEvent("almight-modal-connect-click");
            document.dispatchEvent(event);
        }



        </script>
    </div>`
    }


    script(data: ConnectorModalData): void {
        const qrCodeLoader = document.createElement("script");
        qrCodeLoader.src = "https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"

        qrCodeLoader.onload = function() {
            if((window as any).QRious !== undefined) {
                const canvas = document.getElementById("almight__qrcode")
                canvas.setAttribute("style", "width:90%;")
                const dims = canvas.getBoundingClientRect()
                new (window as any).QRious({element:canvas, value:data.uri,
                    level: "H",
                    size: dims.width,
                
                })
                
               
            }
        }

        const jsfunctions = document.createElement("script");
        jsfunctions.type = "text/javascript"

        const handleCloseClickFunction = document.createTextNode(`function handleCloseClick() {
            const event = new CustomEvent("almight-modal-close-click");
            document.dispatchEvent(event);
        }`)

        const handleConnectClickFunction = document.createTextNode(`function handleConnectClick() {
            const event = new CustomEvent("almight-modal-connect-click");
            document.dispatchEvent(event);
        }`)

        jsfunctions.appendChild(handleCloseClickFunction)
        jsfunctions.appendChild(handleConnectClickFunction)
        if(this.el !== undefined){
            this.el.appendChild(qrCodeLoader);
            this.el.appendChild(jsfunctions)
        }
    }

    open(data: ConnectorModalData): void {
        const div = document.createElement('div')
        div.setAttribute("id", this.id);
        div.innerHTML = this.html(data);

        document.body.appendChild(div);
        this.el = div;
        this.onConnectClick = data.onConnectClick;
        this.script(data)

        const closeButton: HTMLButtonElement = document.querySelector('.almight__close-button')
        let self = this;
        closeButton.onclick = function() {
            document.body.removeChild(div);
            document.removeEventListener("almight-modal-connect-click", self.onConnectClick, true)
        }


        

        document.addEventListener("almight-modal-connect-click", this.onConnectClick, {once: true})
    }


    close(el?: HTMLElement): void {
        if (this.el !== undefined && document.querySelectorAll(`#${this.id}`) !== null) {
            document.removeEventListener("almight-modal-connect-click", this.onConnectClick, true)
            document.body.removeChild(this.el);
        }
    }



    css(data: ConnectorModalData): string {
        return `
        .almight__connector_modal {
            display: block; /* Hidden by default */
            position: fixed; /* Stay in place */
            z-index: 10; /* Sit on top */
            left: 0;
            top: 0;
            width: 100%; /* Full width */
            height: 100%; /* Full height */
            overflow: auto; /* Enable scroll if needed */
            background-color: rgb(0,0,0); /* Fallback color */
            background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
        }
    
        .almight__modal-content {
            background-color: #fefefe;
            margin: 15% auto; /* 15% from the top and centered */
            padding-top: 1.5rem;
            padding-bottom: 2.5rem; /* 40px */
            padding-left: 1rem; /* 16px */
            padding-right: 1rem; /* 16px */
            border: 1px solid #888;
            width: 85%; /* Could be more or less, depending on screen size */
            border-radius: 1rem; /* 16px */
            box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
          }
        
        .almight__btn-holder {
            width: 100%:
            height: auto;
            display: ${(data.hasConnectorButton ? 'flex' : 'none')};
            justify-content: center;
    
        }
    
        .almight__connect {
            text-align:center;
            background-color: blue;
            width: 100%;
            padding: 1rem 0 ;
            margin-right:10%;
            margin-left: 10%;
            border-radius: .5rem; /* 16px */
            color: white;
            font-size: 1.25rem; /* 20px */
            line-height: 1.75rem;
              
        }

        .ionicon {
            width: 32px;
            height: 32px;
        }
        
       
    
        .almight__inner-content {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
    
        .almight__close-button {
            background-color: #f4f4f5;
            /*padding: 1rem; */
            border-radius: 1rem; /* 16px */
        }
    
        .almight__header {
            width:100%;
            height: auto;
            display: flex;
            flex-direction: row-reverse;
        }
    
        .almight__qr-box {
            display: ${(data.uri !== null && data.uri !== undefined && data.hasQRCode) ? 'flex' : 'none'};
            width: 100%;
            height: auto;
            flex-direction: row;
            justify-content: center;
            padding: 0.85rem 0;
        }
    
        .almight__font-koulen {
            font-family: 'Koulen', cursive;
        }
        .almight__banner {
            margin-top:0.5rem;
            display: flex;
            width:100%;
            height: auto;
            justify-content: center;
            
        }
        .almight__banner_child {
            display: flex;
            align-items: center;
            width: auto;
            padding: 0 0.85rem;
            font-size: 1.275rem/* 30px */;
            line-height: 1.25rem/* 36px */;
            --tw-bg-opacity: 1;
            background-color: rgb(226 232 240 / var(--tw-bg-opacity));
            border-radius: .5rem; /* 16px */
        }
    
        .almight__avatar {
            overflow: hidden;
            border-radius: 9999px;
            width: 3rem;
            height: 3rem;
            margin-right: 0.5rem;
            
        }
    
    
    
     
          
    
    
        @media (min-width: 1024px){
              .almight__modal-content {
                padding-left: 2rem; /* 32px */
                padding-right: 2rem; /* 32px */
                width: 45%;
                margin:5% auto;
              }
              .almight__banner_child {
                font-size: 1.875rem/* 30px */;
                line-height: 2.25rem/* 36px */;
              }
              .almight__avatar {
                  width: 4rem;
                  height: 4rem;
              }
              .almight__connect {
                  padding: 1.25rem 0;
                  border-radius: .5rem;
                  
              }
          }
    
          @media (min-width: 1280px){
            .almight__modal-content {
              padding-left: 2.5rem; /* 32px */
              padding-right: 2.5rem; /* 32px */
              width: 35%;
              margin: 3% auto;
            }
            .almight__connect {
                font-size: 1.575rem; /* 30px */
                line-height: 2.25rem;
            }
        }
    
        
        `
    }


}