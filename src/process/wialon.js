const moment = require('moment-timezone')
const wialon = require('wialon')
const axios = require('axios')
moment.locale('es')
const { pool } = require('../db/connection')

let newPosition;

const wialonConnect = async () => {
    // Instance wialon sdk
    try {
        const session = wialon().session
        const wialonSession = await session.start({
            token: '5ca7d406cbfd1c7cebc1283b29b57dea82B6C1003EC5073236BC6C36AB6B24167FB5783A'
        })
        wialonLocations(wialonSession)
    } catch (error) {
        console.log(error)
    }
}

const wialonLocations = async (wialonSession) => {
    try {
        // Query to get the db vehicles
        const personsQuery = `
        select distinct v.id,v.id_datatrack , apv.persona_id  ,p.latitud ,p.longitud  
        from vehiculos v
        inner join asociacion_personas_vehiculos apv on apv.vehiculo_id = v.id and (apv.tipo = 'T' or apv.tipo = 'F')
        left join posiciones p on p.persona_id = apv.persona_id 
        where v.gpsexterno = '1'
        `
        const result = await pool.query(personsQuery)
        // Store the data in the array
        const persons = result.rows.map((person) => ({
            id: person.persona_id,
            id_wialon: person.id_datatrack,
            latitud: person.latitud,
            longitud: person.longitud
        }))
        // Validate if the array is empty
        if (persons.length) {
            // Query to get the wialon vehicles
            const vehicles = await axios.get(`
            https://hst-api.wialon.us/wialon/ajax.html?svc=core/search_items&params=
            {"spec":{"itemsType":"avl_unit","propName":"sys_name","propValueMask":"*","sortType":"sys_name"}
            ,"force":1,"flags":1439,"from":0,"to":0}&sid=${wialonSession.eid}
            `)


            if (vehicles !== undefined) {
            for (let i = 0; i < persons.length; i++) {
            // Find the vehicle
            console.log(i);
            const obj = vehicles.data.items.find(o => o.uid == Number(persons[i].id_wialon));

            if (obj !== undefined) {
                // Store the current position
                newPosition = {
                    latitud: obj.pos.y,
                    longitud: obj.pos.x
                    }
            if (persons[i].longitud === newPosition.longitud && persons[i].latitud === newPosition.latitud) {
                console.log("no se actualizo" , Number(persons[i].id_wialon));           
                } else {
                // validate if the vehicle is in the positions table
                const Position = await pool.query(`
                        select * from posiciones
                        where persona_id = ${Number(persons[i].id)}
                        `)

                if (Position.rows.length <= 0) {
                        pool.query(`
                        insert into posiciones(persona_id,actividad_id,latitud,longitud,velocidad)
                        values(${Number(persons[i].id)},${403},${obj.pos.y},${obj.pos.x},${obj.pos.s})
                        `)
                        } else { 
                            // Get the activity id of the vehicle
                            const logParameters = await pool.query(`
                                select p.actividad_id, p.servicio_id  from posiciones p 
                                where p.persona_id = ${persons[i].id}
                            `)

                            pool.query(`
                                    update posiciones set latitud = ${obj.pos.y} ,
                                    longitud = ${obj.pos.x},
                                    recibido = '${moment(obj.pos.t * 1000).format('YYYY-MM-DD HH:mm:ss')}',
                                    fecha = '${moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')}',
                                    actividad_id = ${(logParameters.rows[0].actividad_id == 511) ? 403 : logParameters.rows[0].actividad_id},
                                    velocidad = ${obj.pos.s}
                                    where persona_id =${persons[i].id}
                                `)

                                // Save the log
                                pool.query(`
                                    INSERT INTO posiciones_hist(id,persona_id,latitud,longitud,servicio_id,actividad_id,velocidad,fecha,recibido) 
                                    VALUES(NEXTVAL('POSICIONES_HIST_ID'),${persons[i].id},${obj.pos.y},${obj.pos.x},${logParameters.rows[0].servicio_id}
                                    ,${logParameters.rows[0].actividad_id},${obj.pos.s},'${moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')}','${moment(obj.pos.t * 1000).format('YYYY-MM-DD HH:mm:ss')}')`
                                ).catch(res => console.log('query 5', res))

                                console.log('actualizado',obj.uid);
                        }
                }
            } else {
                console.log('no existe' , persons[i].id_wialon)
            }

                }
            } else {
                console.log('No hay vehiculos')
            }

        } else {
            console.log('No hay personas para procesar')
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    wialonConnect
}
