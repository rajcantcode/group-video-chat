import { useSocket } from "@/context/socket";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";

const usePeer = () => {
  console.log("Usepeer called");
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const isPeerSet = useRef(false);

  const socket = useSocket();
  const roomId = useRouter().query.roomId;
  console.log(roomId);

  useEffect(() => {
    if (isPeerSet.current || !roomId || !socket) return;
    isPeerSet.current = true;
    console.log("Inside useEffect of usePeer");
    (async function initpeer() {
      const myPeer = new (await import("peerjs")).default();
      setPeer(myPeer);
      console.log("Inside initpeer");
      myPeer.on("open", (id) => {
        console.log(`Your peer id is ${id}`);
        setMyId(id);
        socket?.emit("join-room", roomId, id);
      });
    })();
  }, [roomId, socket]);

  return {
    peer,
    myId,
  };
};

export default usePeer;
