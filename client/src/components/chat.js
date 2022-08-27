import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import Image from "./Image";
import { v4 as uuid } from "uuid";
import SmileOutlined from "@ant-design/icons/SmileOutlined";
import PaperClipOutlined from "@ant-design/icons/PaperClipOutlined";
import { Button, Popover } from "antd";
import "./Form.css";
import ScrollToBottom from "react-scroll-to-bottom";
import "antd/dist/antd.css";

const Chat = () => {
  const [chosenEmoji, setChosenEmoji] = useState(""); // input emoji
  const [file, setFile] = useState(); // image
  const [yourID, setYourID] = useState(); // user ID
  const [messages, setMessages] = useState([]); // store chat
  const [message, setMessage] = useState(""); // input text
  // for emojo button
  const [visible, setVisible] = useState(false);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:8000"); // connection to server

    socketRef.current.on("your id", (id) => {
      // get id of user connecting
      setYourID(id);
    });
    socketRef.current.on("message", (message) => {
      // console.log(message);
      receivedMessage(message);
    });
  }, []);

  // commmunication b/w user / stores all chat data

  function receivedMessage(message) {
    // console.log(message);
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
    }
  };

  //send message to backend
  function sendMessage() {
    if (message !== "") {
      if (file) {
        const messageObject = {
          id: yourID,
          type: "file",
          body: file,
          mimeType: file.type, // file type png jpg
          fileName: file.name,
          key: uuid(),
          time:
            new Date(Date.now()).getHours() +
            ":" +
            new Date(Date.now()).getMinutes(),
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
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };
      setMessage("");
      setChosenEmoji("");
      socketRef.current.emit("send message", messageObject);
    }
  }

  // display content
  function renderMessages(message, index) {
    if (message.type === "file") {
      const blob = new Blob([message.body], { type: message.type });
      return (
        <>
          <div
            key={index}
            className="message"
            id={message.id === yourID ? "other" : "you"}
          >
            <div>
              <div className="message-content">
                <p>
                  <Image fileName={message.fileName} blob={blob} />
                </p>
              </div>
              <div className="message-meta">
                <p id="time">{message.time}</p>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (message.type === "text") {
      if (message.id === yourID) {
        return (
          <>
            <div key={index} className="message" id={"other"}>
              <div>
                <div className="message-content">
                  <p>{message.body}</p>
                </div>
                <div className="message-meta">
                  <p id="time">{message.time}</p>
                </div>
              </div>
            </div>
          </>
        );
      }
      return (
        <div key={index} className="message" id={"you"}>
          <div>
            <div className="message-content">
              <p>{message.body}</p>
            </div>
            <div className="message-meta">
              <p id="time">{message.time}</p>
            </div>
          </div>
        </div>
      );
    }
   
  }
  // for emoji
  const content = (
    <Picker onEmojiClick={onEmojiClick} pickerStyle={{ width: "300px" }} />
  );

  const handleVisibleChange = (newVisible) => {
    setVisible(newVisible);
  };
 
  return (
    <>
      <div className="chat-window">
        <div className="chat-body">
          <ScrollToBottom className="message-container">
            {messages.map(renderMessages)}{" "}
          </ScrollToBottom>
        </div>
        <div
          className="chat-footer"
          onSubmit={ sendMessage}
  
        >
          <input
            type="text"
            value={message}
            placeholder="Hey..."
            onChange={handleChange}
            onKeyPress={(event) => {
              event.key === "Enter" && sendMessage();
            }}
          />
          <Popover 
            content={content}
            trigger="click"
            visible={visible}
            onVisibleChange={handleVisibleChange}
          >
            <Button type="primary">
              <SmileOutlined />
            </Button>
          </Popover>

          <div class="wrapper" style={{ marginTop: "10px" }}>
            <label for="imgClip">
              <PaperClipOutlined
                style={{ fontSize: "29px", color: "#08c", cursor: "pointer" }}
                theme="outlined"
              />
            </label>
            <input
              class="input"
              onChange={selectFile}
              id="imgClip"
              type="file"
              style={{ display: "none", visibility: "none" }}
            ></input>
          </div>
          <button onClick={sendMessage}>&#9658;</button>
        </div>
      </div>
    </>
  );
};

export default Chat;
