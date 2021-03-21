console.log("VERSION 5.13.2020.8.05");

//Get basic keys
const fs = require('fs');
let rawdata = fs.readFileSync('keys.json');
const keys = JSON.parse(rawdata);

    console.log("Keys",keys);
    
    
//Include basics
const Redis = require("redis-fast-driver");
const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;
const Long = mongodb.Long;

 
 
//Connect redis.
const redisClientParams = { host: keys.REDIS_URL, port: 6379, autoConnect:true, doNotRunQuitOnEnd: true };
const redisClient = new Redis(redisClientParams);

    
    
    
    
//Mongo connection init function (entry point)    
const connectMongo = async () => {

    //Connect mongo
    const client = mongodb.MongoClient;

    try {
        let url=keys.ADVANCED_MONGO_URL;
        let dbname=keys.ADVANCED_MONGO_DB;
        
        client.connect(url, function (err, client) {

            client.on('reconnect', () => {
				console.log('Mongo connection re-established');
			});
			
			client.on('close', () => {
				console.log("Mongo connection closed, restarting service");
				process.exit();
            });
            
            let mongoClientDB = client.db(dbname);
            
            console.log("Mongo connection complete ["+url+"] ["+dbname+"]... Err:",err);

             //Initialize Loop
            taskTick(mongoClientDB);
        });
        
    } catch(err) {
        console.log("Mongo connection err",err);
        process.exit();
    }

     
}

const getNow = () => {
    return Math.floor(Date.now() / 1000);
}


//Exuction function
const taskTick = async (mongo) => {
    console.log("tick");
    
    try {
            var now=getNow();
            var query = {
                    "$and": [
                                {
                                    "active": Long.fromString("1")
                                },
                                {
                                    "nextRunDate": {
                                        "$lte": now
                                    }
                                },
                                {
                                    "$or": [
                                        {
                        "runningState": Long.fromString("0")
                                        },
                                        {
                                            "$and": [
                                                {
                                                    "runningState": Long.fromString("1")
                                                },
                                                {
                                                    "runExpireDate": {
                                                        "$lte": now
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "$or": [
                                        {
                                            "calledState": Long.fromString("0")
                                        },
                                        {
                                            "$and": [
                                                {
                                                    "calledState": Long.fromString("1")
                                                },
                                                {
                                                    "callExpireDate": {
                                                        "$lte": now
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        };
    
    
    
        
        var result = await mongo.collection('systasks').find(query).toArray();
        for(var i=0; i < result.length; i++) {
            var thisTask=result[i];
            var fiveMinutes=getNow()+30; //300 for real-30 for test
            console.log("Executing task "+thisTask.sysTaskName);
            
          
              try {
                 var rres = await redisClient.rawCallAsync(["rpush", thisTask.eventType, thisTask._id+"||"+fiveMinutes]);
                 console.log("Redis task emit ["+thisTask.eventType+"]:["+thisTask._id+"||"+fiveMinutes+"] ... ", rres);
                 
                    await mongo.collection('systasks').updateOne({'_id': new ObjectID(thisTask._id)},
                        { $set: { 'calledState': 1, 'callExpireDate': fiveMinutes }  }); 
                        console.log("Set to called and expire in "+fiveMinutes);
                 
            } catch(err) {
                console.log("ERROR FROM TASK EMIT ",err);
            
            }
          
    
        }

   
    
    } catch(err) { console.log("Mongo query error. Exiting.",err); process.exit(); }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    taskTick(mongo);
}



//Start the service
redisClient.on("ready",function() {
    
    connectMongo();

});



console.log("After loop - exiting");
        
 