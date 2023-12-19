const { useSocket } = require("@/context/socket");
const { default: usePeer } = require("@/hooks/usePeer");

const Room = () => {
  const socket = useSocket();
  const { peer, myId } = usePeer();
};

export default Room;
