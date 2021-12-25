//Node.js script to retrieve system statistics and then send them to Dataviz Studio over REST API

const axios = require('axios');
const si = require('systeminformation');

/*----------------------------------------------------
    Config Parameters
----------------------------------------------------*/

const serverName = 'Your Server Name';
const datavizApiKey = "Dataviz API Key";
const yourAccountName = "Dataviz Account Name";

const interval = 60;    //seconds
//----------------------------------------------------


const URL = 'https://'+yourAccountName+'.datavizstudio.com/metrics/status';
const getDate = () => { return (new Date).toUTCString(); }


let sendMetrics = (metricsData) =>
{
    if (metricsData === undefined){
        return;
    }

    console.log(getDate() + '\tSending Metrics');

    axios({
            method: 'POST',
            url:    URL,
            data:   metricsData,
            headers: {
                       'api_key': datavizApiKey
                    },
    })
    .then(response =>
    {
        if (response.data && response.data.status)
        {
            console.log(getDate() + '\tSuccess: ' + response.data.status);
        }
        else
        {
            response.data.reason ? console.log(getDate() + '\tError sending metrics: '+response.data.reason)
                                 : console.log(getDate() + '\tError sending metrics.')
        }
    })
    .catch(error =>
    {
        if(error.response) {
            console.log(error.response);
        }
        else {
            console.log(error);
        }
    });

}


let sendMultpleMetrics = (metricsData) =>
{
    if (metricsData === undefined) {
        return;
    }

    console.log(getDate() + '\tSending Metrics');

    axios({
            method: 'POST',
            url:     URL,
            data: {
                    metrics: metricsData
                },
            headers: {
                       'api_key': datavizApiKey
                    },
    })
    .then(response =>
    {
        if (response.data && response.data.status)
        {
            console.log(getDate() + '\tSuccess: ' + response.data.status);
        }
        else
        {
            response.data.reason ? console.log(getDate() + '\tError sending metrics: '+response.data.reason)
                                 : console.log(getDate() + '\tError sending metrics.')
        }
    })
    .catch(error =>
    {
        if(error.response) {
            console.log(error.response);
        }
        else {
            console.log(error);
        }
    });

}


// ----------------------------------------
// Disk Statistics
// ----------------------------------------
function getDiskStats()
{
    si.fsSize().then((data) => 
    {   
        const myDisk = data.find(disk => disk.fs === '/dev/vda1');
        if (myDisk)
        {
            const diskMetric = [
                                    {
                                        device: serverName,
                                        name:  `${serverName}: Disk Used %`,
                                        value: myDisk.use,
                                        category: 'System'
                                    },
                                    {
                                        device: serverName,
                                        name:  `${serverName}: Disk Used GB`,
                                        value: parseInt(myDisk.used/1024/1024/1024),
                                        category: 'System'
                                    },
                                    {
                                        device: serverName,
                                        name:  `${serverName}: Disk Free GB`,
                                        value: parseInt(myDisk.available/1024/1024/1024),
                                        category: 'System'
                                    },
                                    {
                                        device: serverName,
                                        name:  `${serverName}: Disk Size GB`,
                                        value: parseInt(myDisk.size/1024/1024/1024),
                                        category: 'System'
                                    }
                                ];
 
            sendMultpleMetrics(diskMetric);
        }
    })
    .catch(error =>
    {
        console.error(error);
    })
    .finally(() =>
    {
        setTimeout(getDiskStats, interval*1000);
    });
}
getDiskStats();



// ----------------------------------------
// CPU Statistics
// ----------------------------------------
function getCPUUsage()
{
    si.currentLoad().then((data) => 
    {   
        const cpuLoad = parseFloat(data.currentLoad).toFixed(2); 
        
        const cpuMetric =   { 
                                device: serverName,
                                name:   `${serverName}: CPU Usage %`,
                                value: cpuLoad,
                                type:  'Percentage',
                                category: 'System'
                            };
 
        sendMetrics(cpuMetric);
    })
    .catch(error =>
    {
        console.error(error);
    })
    .finally(() =>
    {
        setTimeout(getCPUUsage, interval*1000);
    });
}

getCPUUsage();



// ----------------------------------------
// Memory Statistics
// ----------------------------------------
function checkMemUsage()
{
    si.mem().then(memData =>
    {
        const memAvailableMB = parseInt(memData.available/1024/1024);
        const memTotalMB = parseInt(memData.total/1024/1024);
        const memUsedPerc = parseFloat(memData.used*100/memData.total).toFixed(2);
        const memLoadPerc = parseFloat((memData.total-memData.available)*100/memData.total).toFixed(2);

        const memMetric = [
                                {
                                    device: serverName,
                                    name: `${serverName}: Memory Usage %`,
                                    value: memUsedPerc,
                                    category: 'System'
                                },
                                {
                                    device: serverName,
                                    name: `${serverName}: Memory Load %`,
                                    value: memLoadPerc,
                                    category: 'System'
                                },
                                {
                                    device: serverName,
                                    name: `${serverName}: Memory Available MB`,
                                    value: memAvailableMB,
                                    category: 'System'
                                },
                                {
                                    device: serverName,
                                    name: `${serverName}: Memory Total MB`,
                                    value: memTotalMB,
                                    category: 'System'
                                }
                           ]; 

        sendMultpleMetrics(memMetric); 
    })
    .catch(error =>
    {
        console.error(error);
    })
    .finally(() =>
    {
        setTimeout(checkMemUsage, interval*1000);
    });

}

checkMemUsage();


// ----------------------------------------
// Process Statistics
// ----------------------------------------
function checkProcessess()
{
    si.services('mysql, httpd')
    .then(data =>
    {
        for (let i=0; i<data.length; i++)
        {
            const cpuUsage = parseInt(data[i].cpu);
            const memUsage = parseInt(data[i].mem);
            const runState = data[i].running ? 1 : 0;

            const processMetrics = [
                                    {
                                        device: serverName,
                                        name:  `${serverName}: ${data[i].name} CPU Usage %`,
                                        value: cpuUsage,
                                        category: 'Process',
                                    },
                                    {
                                        device: serverName,
                                        name:  `${serverName}: ${data[i].name} Memory Usage %`,
                                        value: memUsage,
                                        category: 'Process',
                                    },
                                    {
                                        device: serverName,
                                        name:  `${serverName}: ${data[i].name} Status`,
                                        value: runState,
                                        category: 'Process',
                                    }
                            ];

            sendMultpleMetrics(processMetrics);
            
        }

    })
    .catch(error =>
    {
        console.error(error);
    })
    .finally(() =>
    {
        setTimeout(checkProcessess, interval*1000);
    });

}

checkProcessess();
