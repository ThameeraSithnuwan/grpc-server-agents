const express =require("express");
const {loadPackageDefinition,credentials} = require("@grpc/grpc-js");
const {Server,ServerCredentials}=require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH="./agent.proto"
const packageDefinition=protoLoader.loadSync(PROTO_PATH);
const agentProto=loadPackageDefinition(packageDefinition).agent;

const agentRecords = {}

const server = new Server();

const registerAgent =(call,callback) => {
    const agentAddress=call.request.address;
    const agentId = call.request.agentId;
    agentRecords[agentId] = agentAddress;
    console.log(`Agent registered with ID ${agentId}: ${agentAddress}`);
    callback(null, { agentId });
    console.log(agentRecords);

}
const unregisterAgent=(call,callback)=>{
    const agentId = call.request.agentId;
    delete agentRecords[agentId];
    console.log(`Agent ${agentId} unregistered`);
    callback(null, {});
}
server.addService(agentProto.RestServer.service,{registerAgent,unregisterAgent})
server.bindAsync('0.0.0.0:3000', ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Error binding server:', err);
      return;
    }
    console.log(`GRPC server running at 0.0.0.0:3000`);
  
  });

  const callAgentMethod = (agentId, method, request, callback) => {
    const agentAddress = agentRecords[agentId];
    console.log(agentRecords);
    if (!agentAddress) {
      callback(new Error(`Agent with ID ${agentId} not found`));
      return;
    }
    const client = new agentProto.AgentService(agentAddress, credentials.createInsecure());
    client[method](request, callback);
  };



const app=express();


app.get('/call-agent/:agentId', (req, res) => {
    const agentId = req.params.agentId;
    const request = { };
    callAgentMethod(agentId, 'ping', request, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });

const PORT = process.env.SERVER_PORT || 6000;
app.listen(PORT,()=>{
    console.log(`Server is listening at http://localhost:${PORT}`);
})
