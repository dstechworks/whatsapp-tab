const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Twilio Intialize
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const logger = require('./logger');

const pool = new Pool({
    user: "postgres",
    host: 'db.mgampbhmlnalxohuobpr.supabase.co',
    database: "postgres",
    password: 'gplVhDuxLDMeBKxs',
    port: 5432,
});

async function fetchBalance() {
    try {
        const data = await client.balance.fetch();
        const balance = Math.round(data.balance * 100) / 100;
        const currency = data.currency;
        console.log("\n");
        console.log(`Your account balance is ${balance} ${currency}.`);
        console.log("\n");
    } catch (error) {
        console.error('Error fetching balance:', error.message);
    }
}

async function sendMessage() {
    fetchBalance();
    await delay(5000);

    // Get Excel
    const baseDataPath = path.join(__dirname, 'baseData.xlsx');
    const baseDataExcel = XLSX.readFile(baseDataPath)
    const basedataSheetName = baseDataExcel.SheetNames[1]
    const baseDataSheet = XLSX.utils.sheet_to_json(baseDataExcel.Sheets[basedataSheetName])
    const response = await pool.query(`select * from tab_device_records where branch is not null and branch != 'null' and deploy_status = 'Yes'`);

    let tabTableData = response.rows;

    function findDevices(args) {
        let dataArr = [];
        tabTableData.forEach(x => {
            let filterData = baseDataSheet.find(y => y['Device ID'] == x['device_id']);
            if (filterData) {
                x['Dhanush Id'] = nameHelper(filterData['Dhanush Id']);
                x['Device ID'] = nameHelper(filterData['Device ID']);
                x['Store Name'] = nameHelper(filterData['Store Name']);
                x['Branch'] = nameHelper(filterData['Branch']);
                x['TL Name'] = nameHelper(filterData['TL Name']);
                x['TL Mobile No'] = numberHelper(filterData['TL Mobile No']);
                x['AE Name'] = nameHelper(filterData['AE Name']);
                x['AE Mobile No'] = numberHelper(filterData['AE Mobile No']);
                x['AM Name'] = nameHelper(filterData['AM Name']);
                x['AM Mobile No'] = numberHelper(filterData['AM Mobile No']);
                x['Assistant Name'] = nameHelper(filterData['Assistant Name']);
                x['Assistant Mobile No'] = numberHelper(filterData['Assistant Mobile No']);
                x['Assistant 2 Name'] = nameHelper(filterData['Assistant 2 Name']);
                x['Assistant 2 Mobile No'] = numberHelper(filterData['Assistant 2 Mobile No']);
            }
            if (filterData && (args === "getMatchedDevices")) {
                dataArr.push(x);
            } else if (!filterData && (args === "getNotMatchedDevices")) {
                dataArr.push(x);
            }
        })
        return dataArr;
    }

    function mergeAllData() {
        let temp = [];
        const currentDate = new Date(new Date().getTime() - 5 * 60 * 1000);
        findDevices('getMatchedDevices').forEach(x => {
            if (x?.updated_timestamp && x?.branch != null) {
                if (new Date(x.updated_timestamp) > currentDate) {
                    x['Status'] = 'Active';
                }
                if (new Date(x.updated_timestamp) < currentDate) {
                    x['Status'] = 'InActive';
                }
            }
            temp.push(x)
        })
        return temp;
    }

    function getDevicesByStatus(args) {
        let temp = []
        mergeAllData().forEach(x => {
            if (x['Status'] == args) {
                temp.push(x);
            } else if (x['Status'] == args) {
                temp.push(x);
            }
        })
        return temp
    }

    function delay(milliseconds) {
        return new Promise(resolve => {
            setTimeout(resolve, milliseconds);
        });
    }

    function getAllBranch() {
        let temp = {}
        baseDataSheet.forEach(x => {
            temp[x['Branch']] = {}
        })
        return temp
    }

    function numberHelper(x) {
        if (x && x?.toString()?.replace(/[.\s]/g, '')?.substring(0, 10)?.length == 10) {
            return x?.toString()?.replace(/[.\s]/g, '')?.substring(0, 10);
        } else {
            return undefined;
        }
    }

    function nameHelper(x) {
        if (x && x?.toString()?.toUpperCase()?.length > 0) {
            return x?.toString().trim()?.toUpperCase();
        } else {
            return undefined;
        }
    }

    function conditionChecker(x) {
        if (nameHelper(x['AM Name']) && numberHelper(x['AM Mobile No']) && nameHelper(x['Assistant Name']) && numberHelper(x['Assistant Mobile No'])) {
            return true;
        } else {
            return false;
        }
    }

    // console.log("\n");
    // console.table({
    //     "Total Number of Devices found in Base Sheet ": baseDataSheet.length,
    //     "Total Number of Devices found in Supabase table ": tabTableData?.length,
    //     "Data Not Matched with Base sheet ": findDevices('getNotMatchedDevices').length,
    //     "Data Matched with Base sheet ": findDevices('getMatchedDevices').length,
    //     "Active Devices ": getDevicesByStatus('Active').length,
    //     "IActive Devices ": getDevicesByStatus('InActive').length
    // })
    // console.log("\n");

    let tabTotalCount = 0;
    let AEDevice = {}
    let TLDevice = [];
    let NationalPOCNum = {
        "Hitesh": "8700685675",
        "Dhruv": "8826909378",
        "Sumit": "8920131195",
        "Pratek": "9818429501",
        "Chirag": "9818875211",
        "rusum": "9266903108",
        "Anirban Sen": "9831055203",
        "Nitsh Chabbra": "9712933048",
        "Nalin Kaushik": "9831055468",
        "Gaurav Pundlik": "9831149422",
        "Karan Sehgal": "9953006252",
        "Rishab Agarwal": "9734469759",
        "unknown": "9903955267"
    }
    let DistrictPOCNum = {
        "N": {
            "Neeraj Malhotra": "9910036710",
            "Malika Arjun Kalika": "8123919411",
            "Sumit Bothra": "9831077603"
        },
        "S": {
            "Mr Sudalai Muthu": "9949496708",
            "Vikas": "7483579458",
            "Baker Fen John": "9994810050",
            "Vikram Khosla": "9831055167"
        },
        "E": {
            "Satyendra Singh": "9915440705",
            "Jupiter Guha": "9163323485",
            "Chanchal Mukherjee": "9831873270",
            //"Nikhil Kapoor": "9121017082",
            "Surajit Ghosh": "8585091444",
            "Vishnu": "9790999093"
        },
        "W": {
            "Pankaj Swahney": "8527535300",
            "Chanchal Mukherjee": "9831873270",
            "Vinit Agarwal": "7087685878",
            "Mudit Bagla": "9831055257"
        }
    }
    let zone = {
        "N": {
            active: 0,
            inactive: 0
        },
        "S": {
            active: 0,
            inactive: 0
        },
        "E": {
            active: 0,
            inactive: 0
        },
        "W": {
            active: 0,
            inactive: 0
        }
    }
    let totalDevices = 0;
    let allBranches = getAllBranch()

    mergeAllData().forEach(x => {
        // console.log(x);
        if (x.Status == 'Active') {
            totalDevices++;
            allBranches[x['Branch']].active = 0
            allBranches[x['Branch']].inactive = 0
            allBranches[x['Branch']].total = 0

            if (conditionChecker(x)) {
                AEDevice[x['AE Name']] = []
                AEDevice[x['AE Name']]['Total Count'] = 0
                AEDevice[x['AE Name']]['Active Count'] = 0
                AEDevice[x['AE Name']]['InActive Count'] = 0

                AEDevice[x['AE Name']]['AM Name'] = nameHelper(x['AM Name'])
                AEDevice[x['AE Name']]['AM Mobile No'] = numberHelper(x['AM Mobile No'])
                AEDevice[x['AE Name']]['Assistant Name'] = nameHelper(x['Assistant Name'])
                AEDevice[x['AE Name']]['Assistant Mobile No'] = numberHelper(x['Assistant Mobile No'])
                AEDevice[x['AE Name']]['Assistant 2 Name'] = nameHelper(x['Assistant 2 Name'])
                AEDevice[x['AE Name']]['Assistant 2 Mobile No'] = numberHelper(x['Assistant 2 Mobile No'])

                AEDevice[x['Total Devices']] = []
            }
        }

        if (x.Status == 'InActive') {
            TLDevice.push({
                'Dhanush Id': x['Dhanush Id'],
                'Device ID': x['Device ID'],
                'Store Name': nameHelper(x['Store Name']),
                'Store Number': numberHelper(x['so_contact']),
                'Branch': x['Branch'],
                'TL Name': nameHelper(x['TL Name']),
                'TL Mobile No': numberHelper(x['TL Mobile No']),
                'AE Name': nameHelper(x['AE Name']),
                'AE Mobile No': numberHelper(x['AE Mobile No']),
            })
        }
    })


    mergeAllData().forEach(x => {
        if (AEDevice[x['AE Name']] && x['Branch'] && conditionChecker(x)) {
            allBranches[x['Branch']].total++
            AEDevice[x['AE Name']]['Total Count']++
            if (x.Status == 'Active') {
                allBranches[x['Branch']].active++
                AEDevice[x['AE Name']]['Active Count']++
            }
            if (x.Status == 'InActive') {
                allBranches[x['Branch']].inactive++
                AEDevice[x['AE Name']]['InActive Count']++
            }
        }
    })

    TLDevice.sort((a, b) => {
        if (a.Branch === "SBLR") {
            return -1; // "SBLR" comes first
        } else if (b.Branch === "SBLR") {
            return 1; // "SBLR" comes after
        } else {
            return 0; // no change in order for other branches
        }
    });

    for (const property in allBranches) {
        if (allBranches[property].active != undefined || allBranches[property].inactive != undefined) {
            zone[property.substring(0, 1)].active += parseInt(allBranches[property].active)
            zone[property.substring(0, 1)].inactive += parseInt(allBranches[property].inactive)
        }
    }


    // console.log(totalDevices);
    // console.log(AEDevice);
    // console.log(allBranches);
    // console.log(zone);





    /////////------------------------------- Send National Message ----------------------------/////////
    let messageBodyNP = `NATIONAL TABLET STATUS\nWest : ${zone.W.active} (Active) / ${zone.W.inactive} (Inactive)\nNorth : ${zone.N.active} (Active) / ${zone.N.inactive} (Inactive)\nEast : ${zone.E.active} (Active) / ${zone.E.inactive} (Inactive)\nSouth : ${zone.S.active} (Active) / ${zone.S.inactive} (Inactive)`;
    console.log(messageBodyNP, "\n");

    await delay(10000);

    for (let key in NationalPOCNum) {
        // console.log(`National POC Name : ${key} , Mobile : ${NationalPOCNum[key]}\n`);

        await client.messages
            .create({
                body: messageBodyNP,
                from: 'whatsapp:+13477089308',
                to: `whatsapp:+91${NationalPOCNum[key]}`
            })
            .then((message) => {
                console.log(`${key} ---> ${message.sid}`);
            });

        await delay(1000);
    }




    console.log("\n");
    console.log('*************************** National Messages Done ************************', "\n");
    await delay(2000);





    ////////-------------------------------- Send District Message ----------------------------/////////
    // console.log(allBranches);
    let districtCount = 0;
    for (let key in allBranches) {
        if (allBranches[key]['active']) {
            allBranches[key]["District POC Numbers"] = DistrictPOCNum[`${key[0]}`]
            // console.log(allBranches[key]["District POC Numbers"]);
            for (let pocNum in allBranches[key]["District POC Numbers"]) {
                districtCount++;
                let messageBodyDP = `TABLET STATUS\nBranch Name: ${key}\nTotal Devices: ${allBranches[key]['total']}\nActive Devices: ${allBranches[key]['active']}\nInactive Devices: ${allBranches[key]['inactive']}`;
                // console.log(`Branch : ${key} , District POC Name : ${pocNum} , Mobile : ${allBranches[key]["District POC Numbers"][pocNum]}\n`);
                // console.log(messageBodyDP, "\n");

                await client.messages
                    .create({
                        body: messageBodyDP,
                        from: 'whatsapp:+13477089308',
                        to: `whatsapp:+91${allBranches[key]["District POC Numbers"][pocNum]}`
                    })
                    .then(message => console.log("District ---", districtCount, message.sid, "\n"));

                // if (districtCount > 10) {
                //     await client.messages
                //         .create({
                //             body: messageBodyDP,
                //             from: 'whatsapp:+13477089308',
                //             to: `whatsapp:+91${allBranches[key]["District POC Numbers"][pocNum]}`
                //         })
                //         .then(message => console.log("District ---", districtCount, message.sid, "\n"));
                // }

                await delay(1000);
            }
        }
    }


    console.log('*************************** District Messages Done ************************', "\n");
    await delay(2000);






    ////////-------------------------------- Send AM & Assistant Message ----------------------------/////////
    // console.log(AEDevice)
    const AEDeviceEntries = Object.entries(AEDevice);

    for (let i = 0; i < AEDeviceEntries.length; i++) {
        const [property, data] = AEDeviceEntries[i];

        if (property) {
            // Am Logic
            if (data['AM Name'] && data['AM Mobile No']) {
                let messageBodyAM = `TABLET STATUS\nAE Name: ${property}\nTotal Devices: ${data['Total Count']}\nActive Devices: ${data['Active Count']}\nInactive Devices: ${data['InActive Count']}`
                // console.log(`AM Name : ${data['AM Name']} , Mobile : ${data['AM Mobile No']} \n`);
                // console.log(messageBodyAM, "\n");

                await client.messages
                    .create({
                        body: messageBodyAM,
                        from: 'whatsapp:+13477089308',
                        to: `whatsapp:+91${data['AM Mobile No']}`
                    })
                    .then(message => console.log(i, "AM ---", message.sid));

                ++tabTotalCount
                await delay(1000);
            }

            // Assistant Logic
            if (data['Assistant Name'] && data['Assistant Mobile No']) {
                let messageBodyAssistant = `TABLET STATUS\nAE Name: ${property}\nTotal Devices: ${data['Total Count']}\nActive Devices: ${data['Active Count']}\nInactive Devices: ${data['InActive Count']}`
                // console.log(`Assistant Name : ${data['Assistant Name']} , Mobile : ${data['Assistant Mobile No']} \n`);
                // console.log(messageBodyAssistant, "\n");

                await client.messages
                    .create({
                        body: messageBodyAssistant,
                        from: 'whatsapp:+13477089308',
                        to: `whatsapp:+91${data['Assistant Mobile No']}`
                    })
                    .then(message => console.log(i, "Assistant ---", message.sid, "\n"));

                ++tabTotalCount
                await delay(1000);
            }

            // Assistant 2 Logic
            if (data['Assistant 2 Name'] && data['Assistant 2 Mobile No']) {
                let messageBodyAssistant = `TABLET STATUS\nAE Name: ${property}\nTotal Devices: ${data['Total Count']}\nActive Devices: ${data['Active Count']}\nInactive Devices: ${data['InActive Count']}`
                // console.log(`Assistant 2 Name : ${data['Assistant 2 Name']} , Mobile : ${data['Assistant 2 Mobile No']} \n`);
                // console.log(messageBodyAssistant, "\n");

                await client.messages
                    .create({
                        body: messageBodyAssistant,
                        from: 'whatsapp:+13477089308',
                        to: `whatsapp:+91${data['Assistant 2 Mobile No']}`
                    })
                    .then(message => console.log(i, "Assistant 2 ---", message.sid, "\n"));

                ++tabTotalCount
                await delay(1000);
            }
        }
    }





    console.log('************************ AM & Assistant Messages Done ***********************', "\n");
    await delay(2000);





    ////////-------------------------------- Send AE and TL Message ----------------------------/////////
    // console.log(TLDevice)
    for (let i = 0; i < TLDevice.length; i++) {
        const x = TLDevice[i];
        // console.log("Branch :: ", x['Branch']);

        if (x['Store Name'] && x['Store Number'] && x['Branch'] && x['Device ID']) {
            // Ae Logic
            if (x['AE Name'] && x['AE Mobile No'] && x['TL Name'] && x['TL Mobile No']) {
                let messageBodyAE = `Hi ! Tablet is not working at the following store\nStore Name: ${x['Store Name']}\nDhanush ID: ${x['Dhanush Id']}\nTL Number: ${x['TL Mobile No']}\nStore Number: ${x['Store Number']}`;
                // console.log(`${x['AE Mobile No']}`, "\n")
                // console.log(messageBodyAE)

                await client.messages
                    .create({
                        contentSid: 'HX93f5e09fc4f76c0a1c6f402e17943450',
                        from: 'whatsapp:+13477089308',
                        contentVariables: JSON.stringify({
                            1: x['Store Name'],
                            2: x['Dhanush Id'],
                            3: x['TL Mobile No'],
                            4: x['Store Number'],
                            para: `?storename=${(x['Store Name']).toString().split(' ').join('')}&name=${(x['AE Name']).split(' ').join('')}&number=${x['AE Mobile No']}&dhanushid=${x['Dhanush Id']}&branch=${x['Branch']}&deviceid=${x['Device ID']}&type=tab`
                        }),
                        messagingServiceSid: 'MG2d825e49dc27e0eb0c5f4c5178a71c4f',
                        to: `whatsapp:+91${x['AE Mobile No']}`
                    })
                    .then(message => console.log(i, "AE ---", message.sid));

                ++tabTotalCount
                await delay(1000);
            }

            // Tl Logic
            if (x['TL Name'] && x['TL Mobile No']) {
                let messageBodyTL = `Hi ! Tablet is not working at the following store\nStore Name: ${x['Store Name']}\nDhanush ID: ${x['Dhanush Id']}\nStore Number: ${x['Store Number']}`;
                // console.log(`${x['TL Mobile No']}`, "\n")
                // console.log(messageBodyTL)

                await client.messages
                    .create({
                        contentSid: 'HXf067eb9b1edd1dff1a9c8e22a9071100',
                        from: 'whatsapp:+13477089308',
                        contentVariables: JSON.stringify({
                            1: x['Store Name'],
                            2: x['Dhanush Id'],
                            3: x['Store Number'],
                            para: `?storename=${(x['Store Name']).toString().split(' ').join('')}&name=${(x['TL Name']).split(' ').join('')}&number=${x['TL Mobile No']}&dhanushid=${x['Dhanush Id']}&branch=${x['Branch']}&deviceid=${x['Device ID']}&type=tab`
                        }),
                        messagingServiceSid: 'MG2d825e49dc27e0eb0c5f4c5178a71c4f',
                        to: `whatsapp:+91${x['TL Mobile No']}`
                    })
                    .then(message => console.log(i, "TL ---", message.sid, "\n"));

                ++tabTotalCount
                await delay(1000);
            }
        }
    }

    console.log('*************************** AE and TL Messages Done ************************', "\n");
    console.log("-------------------------- All Messages Sent Successful --------------------");

}

sendMessage();