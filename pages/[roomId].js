import { useSocket } from "@/context/socket";
import usePeer from "@/hooks/usePeer";
import useMediaStream from "@/hooks/useMediaStream";
import Player from "@/components/player";
import { useEffect, useState } from "react";
import usePlayer from "@/hooks/usePlayer";
import styles from "@/styles/room.module.css";
import { useRouter } from "next/router";
import Bottom from "@/components/bottom";
import { cloneDeep } from "lodash";
import CopySection from "@/components/copySection";

const Room = () => {
  const socket = useSocket();
  const { roomId } = useRouter().query;
  const { peer, myId } = usePeer();
  const { stream } = useMediaStream();
  const {
    players,
    setPlayers,
    playerHighlighted,
    nonHighlightedPlayers,
    toggleAudio,
    toggleVideo,
    leaveRoom,
  } = usePlayer(myId, roomId, peer);
  const [users, setUsers] = useState({});

  useEffect(() => {
    if (!socket) return;
    const handleUserConnected = (newUser) => {
      console.log(`User joined the room with userId: ${newUser}`);

      const call = peer.call(newUser, stream);
      call.on("stream", (incomingStream) => {
        console.log("Incoming stream from ", newUser);
        setPlayers((prev) => ({
          ...prev,
          [newUser]: { url: incomingStream, muted: false, playing: true },
        }));
        setUsers((prev) => ({ ...prev, [newUser]: call }));
      });
    };
    socket.on("user-connected", handleUserConnected);

    return () => {
      socket.off("user-connected", handleUserConnected);
    };
  }, [peer, socket, stream, setPlayers]);

  useEffect(() => {
    if (!socket) return;

    const handleToggleAudio = (userId) => {
      console.log(`user with id ${userId} toggled audio`);
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        copy[userId].muted = !copy[userId].muted;
        return { ...copy };
      });
    };

    const handleToggleVideo = (userId) => {
      console.log(`user with id ${userId} toggled video`);
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        copy[userId].playing = !copy[userId].playing;
        return { ...copy };
      });
    };

    const handleUserLeave = (userId) => {
      console.log(`user ${userId} is leaving the room`);
      users[userId]?.close();
      const playersCopy = cloneDeep(players);
      delete playersCopy[userId];
      setPlayers(playersCopy);
    };

    socket.on("user-toggle-audio", handleToggleAudio);
    socket.on("user-toggle-video", handleToggleVideo);
    socket.on("user-leave", handleUserLeave);

    return () => {
      socket.off("user-toggle-audio", handleToggleAudio);
      socket.off("user-toggle-video", handleToggleVideo);
      socket.off("user-leave", handleUserLeave);
    };
  }, [socket]);

  useEffect(() => {
    if (!peer || !stream) return;
    peer.on("call", (call) => {
      const { peer: callerId } = call;
      call.answer(stream);

      call.on("stream", (incomingStream) => {
        console.log("Incoming stream from ", callerId);
        setPlayers((prev) => ({
          ...prev,
          [callerId]: { url: incomingStream, muted: false, playing: true },
        }));
        setUsers((prev) => ({ ...prev, [callerId]: call }));
      });
    });
  }, [peer, stream, setPlayers]);

  useEffect(() => {
    if (!stream || !myId) return;
    console.log("Adding stream to player");
    setPlayers((prev) => ({
      ...prev,
      [myId]: { url: stream, muted: false, playing: true },
    }));
  }, [stream, setPlayers, myId]);

  return (
    <>
      <div className={styles.activePlayerContainer}>
        {playerHighlighted && (
          <Player
            url={playerHighlighted.url}
            muted={playerHighlighted.muted}
            playing={playerHighlighted.playing}
            isActive={true}
          />
        )}
      </div>
      <div className={styles.inActivePlayerContainer}>
        {Object.keys(nonHighlightedPlayers).map((playerId) => {
          const { url, muted, playing } = players[playerId];
          return (
            <Player
              key={playerId}
              url={url}
              muted={muted}
              playing={playing}
              playerId={playerId}
              isActive={false}
            ></Player>
          );
        })}
        {/* <Player url={stream} muted playing playerId={myId}></Player> */}
      </div>
      <CopySection roomId={roomId} />
      <Bottom
        muted={playerHighlighted?.muted}
        playing={playerHighlighted?.playing}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        leaveRoom={leaveRoom}
      />
    </>
  );
};

export default Room;
