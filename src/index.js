// Load the AWS SDK for Node.js
import SMS from 'source-map-support/register';
import AWS from 'aws-sdk';
import rl from 'readline';

const EC2START = {
    DEFAULT_RESION: 'ap-northeast-1'
}

export default class EC2Instances {
    constructor(region = EC2START.DEFAULT_RESION) {
        this.ec2 = new AWS.EC2({
            region: region,
            apiVersion: '2016-11-15'
        });
    }
    _convertDescribeInstancesResult(data) {
        let instances = [];
        for (const elem of data.Reservations) {
            let instance = {
                name: elem.Instances[0].Tags.find(tag => {
                    return tag.Key === 'Name';
                }),
                id: elem.Instances[0].InstanceId,
                status: elem.Instances[0].State.Name,
                globalIp: elem.Instances[0].PublicIpAddress
            }
            instances.push(instance);
        }
        return instances;
    }
    getInstanceList() {
        return new Promise((resolve, reject) => {
            var params = {
                DryRun: false,
            };
            this.ec2.describeInstances(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this._convertDescribeInstancesResult(data));
                }
            });
        });
    }
    _startInstanceCall = (params) =>{
        console.log('start _startInstanceCall');
        return new Promise((resolve) => {
            this.ec2.startInstances(params, (err, data) => {
                resolve({
                    err,
                    data
                });
            });
        });
    }
    startInstance = async (instanceId) => {
        var params = {
            InstanceIds: [instanceId],
            DryRun: true
        };

        const dryRunRes = await this._startInstanceCall(params);
        if (dryRunRes.err.code !== 'DryRunOperation') {
            console.log("You don't have permission to start instances.");
            console.log(dryRunRes.err);
            return;
        }

        params.DryRun = false;
        const mainRunRes = await this._startInstanceCall(params);
        if (mainRunRes.err) {
            console.log('error');
            return;
        }
        console.log(mainRunRes.data.StartingInstances);
    }
    _stopInstanceCall = (params) => {
        return new Promise((resolve) => {
            this.ec2.stopInstances(params, (err, data) => {
                console.log(data);
                resolve({
                    err,
                    data
                });
            });
        });
    }
    stopInstance = async (instanceId) => {
        var params = {
            InstanceIds: [instanceId],
            DryRun: true
        };

        const dryRunRes = await this._stopInstanceCall(params);
        if (dryRunRes.err.code !== 'DryRunOperation') {
            console.log("You don't have permission to start instances.");
            console.log(dryRunRes.err);
            return;
        }

        params.DryRun = false;
        const mainRunRes = await this._stopInstanceCall(params);
        if (mainRunRes.err) {
            console.log('error');
            return;
        }
        console.log(mainRunRes.data.StartingInstances);
    }
    startInstancesAll = async () => {
        const instances = await this.getInstanceList();
        for (const instance of instances) {
            if (instance.status === 'stopped') {
                await this.startInstance(instance.id);
            }
        }
    }
    stopInstancesAll = async () => {
        const instances = await this.getInstanceList();
        for (const instance of instances) {
            if (instance.status === 'running') {
                await this.stopInstance(instance.id);
            }
        }
    }
    showInstances = async () => {
        let instances = await this.getInstanceList();
        console.log(instances);
    }
    inputCmd = async (line) => {
        console.log(`cmd > ${line}`);
        const cmd = line.replace('\n', '');
        switch (cmd) {
            case 'list':
                await this.showInstances();
                break;
            case 'start':
                await this.startInstancesAll();
                break;
            case 'stop':
                await this.stopInstancesAll();
                break;
            default:
                this.showCmd();
        }
        this.showWaitPrompt();
    }
    showCmd = () => {
        console.log('list:show instance list');
        console.log('stop:stop instance');
        console.log('start:stop instance');
    }
    showWaitPrompt = () => {
        console.log('input command:');
    }
};

async function main() {
    const ec2Instances = new EC2Instances();
    await ec2Instances.showInstances();
    ec2Instances.showCmd();
    ec2Instances.showWaitPrompt();
    const rli = rl.createInterface(process.stdin, process.stdout);
    rli.on('line', ec2Instances.inputCmd);
}

main();