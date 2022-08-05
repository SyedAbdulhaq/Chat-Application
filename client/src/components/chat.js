import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import Image from "./Image";
import { v4 as uuid } from "uuid";

const Page = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  align-items: center;
  background-color: #6b6868;
  flex-direction: column;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 420px;
  max-height: 500px;
  overflow: auto;
  width: 300px;
  border: 1px solid rgb(3, 3, 3);
  border-radius: 10px;
  padding-bottom: 10px;
  margin-top: 25px;
  align-items: center;
`;
const TextArea = styled.textarea`
  width: 71%;
  height: 40px;

  border-radius: 10px;
  margin-top: 10px;
  padding-left: 15px;
  margin-left: 46px;

  text-align: left;

  padding-top: 10px;
  font-size: 17px;
  background-color: transparent;
  border: 1px solid black;
  outline: none;
  color: lightgray;
  letter-spacing: 1px;

  line-height: 20px;
  ::placeholder {
    color: lightgray;
  }
`;

const Button = styled.button`
  background-color: #92a8d1;
  width: 76%;
  border: none;
  height: 50px;
  margin-left: 46px;
  border-radius: 10px;
  color: #46516e;
  font-size: 17px;
  align-items: center;
`;

const Form = styled.form`
  width: 400px;
`;

const MyRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const MyMessage = styled.div`
  width: 45%;
  background-color: #92a8d1;
  color: #46516e;
  padding: 10px;
  margin-right: 5px;
  text-align: center;
  border-top-right-radius: 10%;
  border-bottom-right-radius: 10%;
`;

const PartnerRow = styled(MyRow)`
  justify-content: flex-start;
`;

const PartnerMessage = styled.div`
  width: 45%;
  background-color: transparent;
  color: lightgray;
  border: 1px solid lightgray;
  padding: 10px;
  margin-left: 5px;
  text-align: center;
  border-top-left-radius: 10%;
  border-bottom-left-radius: 10%;
`;

const Chat = () => {
  const [chosenEmoji, setChosenEmoji] = useState(""); // input emoji
  const [file, setFile] = useState(); // image

  const [yourID, setYourID] = useState(); // user ID
  const [messages, setMessages] = useState([]); // store chat
  const [message, setMessage] = useState(""); // input text

  const [serviceList, setServiceList] = useState([{ service: "" }]); // option input
  const [question, setQuestion] = useState(""); // question input

  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io.connect("/"); // connection to server

    socketRef.current.on("your id", (id) => {
      // get id
      setYourID(id);
    });

    socketRef.current.on("message", (message) => {
      console.log("here");
      receivedMessage(message);
    });
  }, []);
  // commmunication b/w user / stores all chat data
  function receivedMessage(message) {
    setMessages((oldMsgs) => [...oldMsgs, message]);
  }

  // for message
  function handleChange(e) {
    setMessage(e.target.value);
  }
  // set file
  function selectFile(e) {
    setMessage(e.target.files[0].name); // to show file name
    setFile(e.target.files[0]);
  }

  // set emoji in message
  const onEmojiClick = (event, emojiObject) => {
    setChosenEmoji(emojiObject);
    if (chosenEmoji === "") {
      setMessage(message);
    } else {
      setMessage(message.concat(chosenEmoji.emoji)); // emoji + text
      setQuestion(question.concat(chosenEmoji.emoji));
    }
  };

  //add question
  const handleQuestion = (e) => {
    setQuestion(e.target.value);
  };

  // add value to option
  const handleServiceChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...serviceList];
    list[index][name] = value;
    setServiceList(list);
    console.log(serviceList);
  };

  // remove a option
  const handleServiceRemove = (index) => {
    const list = [...serviceList];
    list.splice(index, 1);
    setServiceList(list);
  };

  // update the state for new value
  const handleServiceAdd = () => {
    setServiceList([...serviceList, { service: "" }]);
  };

  //send message to backend
  function sendMessage(e) {
    e.preventDefault();
    if (file) {
      const messageObject = {
        id: yourID,
        type: "file",
        body: file,
        mimeType: file.type, // file type png jpg
        fileName: file.name,
        key: uuid(),
      };
      setFile();
      setMessage("");
      socketRef.current.emit("send message", messageObject);
    }
    const messageObject = {
      id: yourID,
      type: "text",
      body: message,
      key: uuid(),
    };
    setMessage("");
    setChosenEmoji("");
    socketRef.current.emit("send message", messageObject);
  }

  // send question & options
  function sendQuestion(e) {
    e.preventDefault();
    const messageObject = {
      id: yourID,
      type: "text",
      body: question,
      key: uuid(),
    };
    setMessage("");
    setChosenEmoji("");
    setQuestion("");
    socketRef.current.emit("send message", messageObject);
    serviceList.map((singleService) => {
      const messageObject = {
        id: yourID,
        type: "option",
        body: singleService.service,
        key: uuid(),
      };
      setServiceList([{ service: "" }]);
      socketRef.current.emit("send message", messageObject);
    });
  }

  // display content
  function renderMessages(message, index) {
    if (message.type === "file") {
      const blob = new Blob([message.body], { type: message.type });
      if (message.id === yourID) {
        return (
          <MyRow key={index}>
            <Image fileName={message.fileName} blob={blob} />
          </MyRow>
        );
      }
      return (
        <PartnerRow key={index}>
          <Image fileName={message.fileName} blob={blob} />
        </PartnerRow>
      );
    }

    if (message.type === "text") {
      if (message.id === yourID) {
        return (
          <MyRow key={index}>
            <MyMessage> {message.body}</MyMessage>
          </MyRow>
        );
      }
      return (
        <PartnerRow key={index}>
          <PartnerMessage>{message.body}</PartnerMessage>
        </PartnerRow>
      );
    }
    if (message.id === yourID) {
      return (
        <MyRow key={index}>
          <input type="checkbox" checked={message.defaultChecked} />
          <MyMessage>{message.body}</MyMessage>
        </MyRow>
      );
    }
    return (
      <PartnerRow key={index}>
        <PartnerMessage>{message.body}</PartnerMessage>
        <input
          type="checkbox"
          onChange={(e) => {
            // console.log(e.target.checked);
            if (e.target.checked === true) {
              const messageObject = {
                id: yourID,
                type: "text",
                body: message.body,
                key: message.key,
              };
              socketRef.current.emit("send message", messageObject);
            }
          }}
        />
      </PartnerRow>
    );
  }

  return (
    <Page>
      <Container>{messages.map(renderMessages)}</Container>

      <Form onSubmit={sendMessage}>
        <TextArea
          value={message}
          onChange={handleChange}
          placeholder="Say something..."
        />

        <p>
          <button
            class="btn btn-primary"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseExample1"
            aria-expanded="false"
            aria-controls="collapseExample"
          >
            Emoji
          </button>
        </p>
        <div class="collapse" id="collapseExample1">
          <div class="card card-body">
            <Picker
              onEmojiClick={onEmojiClick}
              pickerStyle={{ width: "100%" }}
            />
          </div>
        </div>

        <div class="dropdown">
          <a
            class="btn btn-secondary dropdown-toggle"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Option
          </a>

          <ul class="dropdown-menu">
            <li>
              <a class="dropdown-item">
                <form action="click">
                  <input onChange={selectFile} type="file" />
                </form>
              </a>
            </li>
            <li>
              <p>
                <button
                  class="btn btn-primary"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseExample"
                  aria-expanded="false"
                  aria-controls="collapseExample"
                >
                  Create select
                </button>
              </p>
            </li>
          </ul>
          <div class="collapse" id="collapseExample">
            <div class="card card-body">
              <input
                value={question}
                onChange={handleQuestion}
                placeholder="Your question.."
              />

              {/* POll feature */}

              <form autoComplete="off">
                <div className="form-field">
                  {serviceList.map((singleService, index) => (
                    <div key={index} className="services">
                      <div className="first-division">
                        <input
                          name="service"
                          type="text"
                          id="service"
                          value={singleService.service}
                          onChange={(e) => handleServiceChange(e, index)}
                          required
                        />
                        {serviceList.length - 1 === index &&
                          serviceList.length < 4 && (
                            <button type="button" onClick={handleServiceAdd}>
                              <span>Option</span>
                            </button>
                          )}
                      </div>
                      <div className="second-division">
                        {serviceList.length !== 1 && (
                          <button
                            type="button"
                            onClick={() => handleServiceRemove(index)}
                          >
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </form>

              {/* POll feature */}
              <button
                class="btn btn-primary"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseExample"
                aria-expanded="false"
                onClick={sendQuestion}
              >
                Save
              </button>
            </div>
          </div>
        </div>

        <Button>Send</Button>
      </Form>
    </Page>
  );
};

export default Chat;
