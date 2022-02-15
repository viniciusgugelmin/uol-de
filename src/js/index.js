const url = new URL(window.location.href);
const nameParam = url.searchParams.get("name");

let chat = document.querySelector("#chat");

let loggedIn = false;

let participants = [];
let messages = [];

let to = "Todos";
let type = "message";

let isGettingMessages = false;

const reloadParam = "?_ijt=l53oo78oipcls6ajtvms0auov5&_ij_reload=RELOAD_ON_SAVE";

checkUrlParameters();

class AppError {
    constructor(fn, message, statusCode) {
        console.log(`AppError (${fn}): ${message} - ${statusCode}`);
    }
}

function checkUrlParameters() {
    if (nameParam) {
        loginChat();
        return;
    }

    goToSignup();
}

async function loginChat() {
    await axios
        .post(`https://mock-api.driven.com.br/api/v4/uol/participants`, {
            name: nameParam,
        })
        .then((response) => {
            loggedIn = true;
            getParticipants();
            getMessages();
        })
        .catch((error) => {
            new AppError("loginChat", error.message, error.response.status);
            goToSignup();
        });
}

function keepLogged() {
    if (!loggedIn) return;

    axios
        .post(`https://mock-api.driven.com.br/api/v4/uol/status`, {
            name: nameParam,
        })
        .catch((error) => {
            new AppError("keepLogged", error.message, error.response.status);
            goToSignup();
        });
}

function goToSignup() {
    window.location.href = `./templates/signup.html${reloadParam}`;
}

function getParticipants() {
    axios.get(`https://mock-api.driven.com.br/api/v4/uol/participants`).then((response) => {
        let conctacts = document.querySelector("#contacts");
        let oldParticipants = participants;
        participants = [];
        participants.push({ name: "Todos" }, ...response.data);

        if (participants.findIndex((participant) => participant.name === to) === -1) to = "Todos";

        if (oldParticipants === participants) return;

        conctacts.innerHTML = "";

        participants.map((participant) => {
            if (participant.name === nameParam) return;

            conctacts.innerHTML += `
                    <p onclick="changeMessageTo(this)" class="de-contacts__item ${
                        to === participant.name ? "de-contacts__item--selected" : ""
                    }">
                        <img src="./assets/${
                            participant === "Todos" ? "users" : "user"
                        }.jpg" alt="${participant.name.toLowerCase()}">
                        <span>${participant.name}</span>
                        <img src="./assets/check.jpg" alt="check">
                    </p>`;
        });
    });
}

async function getMessages() {
    if (!loggedIn || isGettingMessages) return;

    isGettingMessages = true;

    await axios
        .get(`https://mock-api.driven.com.br/api/v4/uol/messages`)
        .then((response) => {
            let newMessages = response.data;
            let newLastMessage;

            if (messages.length > 0) {
                newLastMessage = messages[messages.length - 1];

                newMessages = newMessages.slice(
                    newMessages.findIndex((message) => getIfIsLastSavedMessage(message, newLastMessage)) + 1
                );
            }

            if (newMessages.length > 0) {
                console.log(
                    `New messages: ${newMessages.length}, messages length: ${
                        document.querySelectorAll("#chat .de-message").length
                    }`
                );
            }

            messages.push(...newMessages);

            newMessages.map((message) => {
                createCard(message);
            });

            if (newLastMessage?.time !== newMessages[newMessages.length - 1]?.time) {
                setTimeout(() => {
                    const lastCardMessage = document.querySelector("#chat .de-message:last-child");
                    lastCardMessage.scrollIntoView({
                        behavior: "smooth",
                    });
                }, 500);
            }
        })
        .catch((error) => {
            new AppError("getMessages", error.message, error.response.status);
        });

    await getParticipants();

    isGettingMessages = false;
}

function createCard(card) {
    if (card.type === "private_message" && card.to !== nameParam && card.from !== nameParam && card.to !== "Todos")
        return;

    let nameHtml = `<strong>${card.from}</strong> `;
    let classCard = `de-message de-message--${card.type}`;

    if (card.type === "message") {
        nameHtml += `para <strong>${card.to}</strong>:`;
    }

    if (card.type === "private_message") {
        nameHtml += `reservadamente para <strong>${card.to}</strong>:`;
    }

    chat.innerHTML += `<div class="${classCard}">
                <span class="de-message__time">(${card.time})</span>
                <span class="de-message__name">${nameHtml}</span>
                <span class="de-message__message">${card.text}</span>
            </div>`;
}

function sendMessage() {
    let message = document.querySelector('input[name="message"]').value;

    if (message.length === 0) return;

    axios
        .post(`https://mock-api.driven.com.br/api/v4/uol/messages`, {
            from: nameParam,
            to,
            text: message,
            type,
        })
        .then((response) => {
            document.querySelector('input[name="message"]').value = "";
            getMessages();
        })
        .catch((error) => {
            new AppError("sendMessage", error.message, error.response.status);
            goToSignup();
        });
}

function getIfIsLastSavedMessage(message, newLastMessage) {
    return (
        message.time === newLastMessage.time &&
        message.to === newLastMessage.to &&
        message.from === newLastMessage.from &&
        message.type === newLastMessage.type
    );
}

function changeVisibility(item, value) {
    [...item.parentElement.children].forEach((children) => {
        children.classList.remove("de-visibilities__item--selected");
    });

    item.classList.add("de-visibilities__item--selected");

    type = value;
}

function changeMessageTo(item) {
    [...item.parentElement.children].forEach((children) => {
        children.classList.remove("de-contacts__item--selected");
    });

    item.classList.add("de-contacts__item--selected");

    to = item.children[1].innerText;
}

function closeOverlay(el) {
    el.classList.add("de-overlay--hide");

    let asideMenu = document.querySelector("#aside-menu");
    asideMenu.classList.add("de-aside--hide");
}

function openAsideMenu() {
    let overlay = document.querySelector("#overlay");
    overlay.classList.remove("de-overlay--hide");

    let asideMenu = document.querySelector("#aside-menu");
    asideMenu.classList.remove("de-aside--hide");
}

setInterval(() => {
    getMessages();
}, 3000);

setInterval(() => {
    keepLogged();
}, 5000);

document.addEventListener("keyup", function (event) {
    if (event.keyCode !== 13) return;

    event.preventDefault();
    sendMessage();
});
