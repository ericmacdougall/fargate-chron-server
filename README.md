# fargate-chron-server
ECS/Containerized application to handle periodic execution of containerized distributed tasks by using redis and mongo

* Uses AWS redis to talk to services
* Uses mongodb to manage task status/definitions
* Deploys via gitlab-ci by building on an aws ec2 instance and pushing to ECR - you can create triggers in AWS to make updates to ECR update fargate tasks
* Example task definition record in mongodb:

```
{ 
    "_id" : ObjectId("..."), 
    "sysTaskName" : "testProcess", 
    "eventType" : "testEvent", 
    "eventParams" : "{}", 
    "frequency" : NumberInt(30), 
    "executionMax" : NumberInt(300), 
    "nextRunDate" : NumberInt(0), 
    "runningState" : NumberInt(0), 
    "runExpireDate" : NumberInt(0), 
    "runningStartDate" : NumberInt(0), 
    "lastRunLength" : NumberInt(0), 
    "userContext" : "", 
    "calledState" : NumberInt(0), 
    "callExpireDate" : NumberInt(0), 
    "active" : NumberInt(1), 
}
```


Example chron: https://github.com/ericmacdougall/fargate-chron/
