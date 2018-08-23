const mongo = require('mongodb').MongoClient
const client = require('socket.io').listen(4000).sockets

// connect to mongodb
const url = 'mongodb://127.0.0.1/mongochat'

mongo.connect(url, function(err, db) {
    if(err) {
        throw err
    }
    console.log('connected to port 4000 ***mongodb***')

    client.on('connection', (socket) => {
        let chat = db.collection('chats')

        // create function to send status
        sendStatus = function(stat) {
            socket.emit('status', stat)
        }

        // get chat from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray((err, res) => {
            if(err) {
                throw err
            }

            // emit the message
            socket.emit('output', res)
        })

        // handle input event
        socket.on('input', (data) => {
            let name = data.name
            let message = data.message

            if(!name || !message) {
                sendStatus('Please input your name and message')
            } else {
                chat.insert({name: name, message: message}, () => {
                    client.emit('output', [data])
                    
                    // sending status object
                    sendStatus({
                        message: '✓',
                        clear: true
                    })
                })
            }
        })
        
        // clear message
        socket.on('clear', (data) => {
            chat.remove({}, () => {
                socket.emit('cleared')
            })
        })
    })
})