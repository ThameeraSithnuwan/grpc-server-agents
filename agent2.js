const {loadPackageDefinition,Server,ServerCredentials,credentials} = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const PROTO_PATH="./agent.proto"

const packageDefinition=protoLoader.loadSync(PROTO_PATH);

const agentProto=loadPackageDefinition(packageDefinition).agent;

const server=new Server();

server.addService(agentProto.AgentService.service,{
    ping:(call,callback)=>{
        console.log('Received ping from the agent1');
        callback(null,{message:"Pong"})
    }
});

const PORT= process.env.AGENT_PORT || "5001";
const HOST= process.env.AGENT_HOST || "localhost";
const ADDRESS= `${HOST}:${PORT}`;

const restServerClient = new agentProto.RestServer(`${HOST}:3000`,credentials.createInsecure())

server.bindAsync(ADDRESS,ServerCredentials.createInsecure(),(err,port)=>{
    if(err){
        console.error(`Error binding the server`,err);
        return;
    }
    console.log(`gRPC agent is running at ${ADDRESS}`);
    restServerClient.registerAgent({agentId:"agent2",address:ADDRESS},(err,response)=>{
    if(err){
        console.error('Error registering agent:',err);
    }else{
        console.log('Agent Registered successfully');
    }
    })
})


process.on('SIGINT', () => {
    console.log('SIGINT received. Unregistering agent...');
    restServerClient.unregisterAgent({ agentId: "agent2" }, (err, response) => {
        if (err) {
          console.error('Error unregistering agent:', err);
        } else {
          console.log('Agent unregistered successfully');
        }
      });
    console.log("here");
  });
