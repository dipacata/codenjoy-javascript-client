/*-
 * #%L
 * Codenjoy - it's a dojo-like platform from developers to developers.
 * %%
 * Copyright (C) 2012 - 2022 Codenjoy
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program.  If not, see
 * <http://www.gnu.org/licenses/gpl-3.0.html>.
 * #L%
 */

const point = require('./../../engine/point.js');


var MollymageSolver = module.exports = {

    get: function (board) {
        /**
         * @return next hero action
         */

        var Games = require('./../../engine/games.js');
        var Point = require('./../../engine/point.js');
        var Direction = Games.require('./direction.js');
        var Element = Games.require('./elements.js');
        var Stuff = require('./../../engine/stuff.js');

        // TODO your code here

        var futureBlast = futureBlastExtended();
        const posHero = board.getHero();
        const barriers = board.getBarriers();
        const perks = board.getPerks();
        const otherHeroes = board.findAll(Element.OTHER_HERO);
        // const otherHeroes = board.findAll(Element.OTHER_HERO).concat(board.findAll(Element.ENEMY_HERO));
        //const objectives = perks.concat(otherHeroes);
        const objectives = perks.concat(otherHeroes).concat(board.getTreasureBoxes());
        const getNearFieldsArround = getNearFields(posHero.x, posHero.y, 4)
        const safeFields = perks.concat(board.findAll(Element.NONE));
        // const safeFields = board.findAll(Element.NONE);
        // const futureBlast = board.getFutureBlasts();
        const barriesForSafePath = board.getGhosts().concat(board.getWalls()).concat(board.getPotions()).concat(board.getTreasureBoxes()).concat(board.getOtherHeroes());
        const barriesForObjectivePath = board.getGhosts().concat(board.getWalls()).concat(board.getPotions()).concat(board.getTreasureBoxes()).concat(board.getOtherHeroes()).concat(futureBlast);
        //const barriesForPath = [Element.GHOST, Element.GHOST_DEAD, Element.WALL, Element.WALL];

        // const safeFieldsWithNoFutureBlast = futureBlast.filter((blast) => {
        //     return !board.contains(safeFields, blast) && !(posHero.x == blast.x && posHero.y == blast.y)
        // })

        const safeFieldsWithNoFutureBlast = safeFields.filter((noneBlast) => {
            if (!board.contains(futureBlast, noneBlast) && board.contains(getNearFieldsArround, noneBlast)) {
                return noneBlast;
            }
        })

        //console.log('safeFieldsWithNoFutureBlast:', safeFieldsWithNoFutureBlast)

        localStorage.setItem('latest_x', posHero.x);
        localStorage.setItem('latest_y', posHero.y);

        function Field(x, y) {
            this.x = x;
            this.y = y;
            this.f = 0;
            this.g = 0;
            this.h = 0;
            this.possibleMovs = [
                { x: x - 1, y: y, direction: 'LEFT' },
                { x: x + 1, y: y, direction: 'RIGHT' },
                { x: x, y: y - 1, direction: 'DOWN' },
                { x: x, y: y + 1, direction: 'UP' }
            ]
            this.padre = null;
        }

        function calculateShortestPath(destinationField, isFromBoomZone) {
            //console.log(`FIND THE CLOSEST PATH TO ${destinationField}`)

            originField = new Field(posHero.x, posHero.y)
            destField = new Field(destinationField.x, destinationField.y)

            let openList = [];
            let closedList = [];
            let path = [];
            let finished = false;
            let nextMove = ''

            //First the origin Field is added to Open List
            openList.push(originField);

            while (!finished) {
                if (openList.length > 0) {
                    let winnerIndex = 0;
                    //console.log('**************')
                    for (iterator in openList) {
                        //console.log('(' + openList[iterator].x + ',' + openList[iterator].y + ')-f:' + openList[iterator].f + ' g:' + openList[iterator].g)
                        if (openList[iterator].f < openList[winnerIndex].f) {
                            winnerIndex = iterator;
                        }
                    }
                    //console.log('Final winnerIndex', winnerIndex)
                    const currentField = openList[winnerIndex];
                    //console.log('CURRENT FIELD: (' + currentField.x + ',' + currentField.y + ')')

                    if (currentField.x === destField.x && currentField.y === destField.y) {
                        var temporal = currentField;
                        path.push(temporal);

                        while (temporal.padre != null) {
                            temporal = temporal.padre;
                            path.push(temporal);
                        }

                        //console.log('path encontrado');
                        finished = true;

                    }
                    else {
                        //console.log('Seguir buscando...')

                        openList.splice(openList.indexOf(currentField), 1);
                        closedList.push(currentField);

                        ////console.log('openList:')
                        //openList.map(item => //console.log('(' + item.x + ',' + item.y + ')'))
                        ////console.log('closedList:')
                        //closedList.map((item) => //console.log('(' + item.x + ',' + item.y + ')'))

                        //analize adyacent fields.
                        for (possibleMov of currentField.possibleMovs) {
                            const possibleField = new Field(possibleMov.x, possibleMov.y)
                            //console.log('vecino[(', possibleField.x + ',' + possibleField.y + ') - ' + possibleMov.direction + ']')

                            if (possibleField.x < 0 || possibleField.y < 0) {
                                continue;
                            }
                            const contenidoClosed = closedList.filter((point) => {
                                return point.x === possibleField.x && point.y === possibleField.y;
                            })

                            const contenidoOpen = openList.filter((point) => {
                                return point.x === possibleField.x && point.y === possibleField.y;
                            })

                            //SI EL VECINO NO ESTÁ EN CLOSEDSET Y NO ES UNA PARED, HACEMOS LOS CÁLCULOS
                            barriesForPath = isFromBoomZone ? barriesForSafePath : barriesForObjectivePath;

                            //console.log(`Hay una barrera en (${possibleField.x}, ${possibleField.y})? => ${board.contains(barriesForPath, new Point(possibleField.x, possibleField.y))}`)
                            //console.log('contenidoClosed.length === 0 => ', contenidoClosed.length === 0)

                            if ((!board.contains(barriesForPath, new Point(possibleField.x, possibleField.y))
                                && contenidoClosed.length === 0
                                // && getNearExtended(possibleField.x, possibleField.y,1).includes(Element.GHOST)
                                && !board.isAt(possibleField.x + 1, possibleField.y, Element.GHOST) 
                                && !board.isAt(possibleField.x - 1, possibleField.y, Element.GHOST)  
                                && !board.isAt(possibleField.x, possibleField.y + 1, Element.GHOST)  
                                && !board.isAt(possibleField.x, possibleField.y + 1, Element.GHOST))
                                || (possibleField.x === destField.x && possibleField.y === destField.y)) {
                                //pasos hasta el paso actual + el costo de ir a un vecino
                                const currentG = currentField.g + 1;

                                //si el vecino ya está en OpenSet y su peso es mayor
                                if (contenidoOpen.length === 1) {
                                    //console.log('Vecino Ya existe en OPENLIST, g:' + contenidoOpen.g)
                                    if (currentG < contenidoOpen.g) {
                                        contenidoOpen.g = currentG;     //path más corto
                                    }
                                }
                                else {
                                    possibleField.g = currentG;
                                    openList.push(possibleField);
                                    //console.log(`Added to OpenList (${possibleField.x},${possibleField.y})- ${possibleMov.direction} g:${possibleField.g}`)
                                }

                                //ACTUALIZAMOS VALORES
                                possibleField.h = (Math.abs(possibleMov.x - destField.x)) + (Math.abs(possibleMov.y - destField.y));
                                possibleField.f = possibleField.g + possibleField.h;

                                //GUARDAMOS EL PADRE (DE DÓNDE VENIMOS)
                                possibleField.padre = currentField;
                            }
                        }
                    }
                }
                else {
                    finished = true
                }
            }

            finished = true;   //el algoritmo ha terminado

            if (Object.entries(path).length > 0) {
                //path.map((item) => console.log('(' + item.x + ',' + item.y + ')'))

                nextMove = originField.possibleMovs.filter((point) => {
                    return point.x === path[Object.entries(path).length - 2].x && point.y === path[Object.entries(path).length - 2].y;
                });
                //[Direccion, Pasos a dar]
                return [nextMove[0].direction, Object.entries(path).length]
            }
        }

        function findClosestElement(element, isFromBoomZone) {
            let lessDistance = 100;
            let closestElement = '';


            element.map((item) => {
                let possiblePath = calculateShortestPath(item, isFromBoomZone)
                //console.log('possiblePath', possiblePath)
                if (possiblePath !== undefined) {
                    if (possiblePath[1] < lessDistance) {
                        lessDistance = possiblePath[1];
                        closestElement = item;
                    }
                }
            })

            // for (const iterator of element) {
            // }
            //console.log('retornar el punto mas cerca:', closestElement)
            return closestElement;
        }

        function futureBlastExtended() {
            var potions = board.getPotions();
            var result = [];
            for (var index in potions) {
                var potion = potions[index];
                result.push(potion);
                result.push(new Point(potion.getX() - 1, potion.getY()));
                result.push(new Point(potion.getX() + 1, potion.getY()));
                result.push(new Point(potion.getX(), potion.getY() - 1));
                result.push(new Point(potion.getX(), potion.getY() + 1));
                result.push(new Point(potion.getX() - 2, potion.getY()));
                result.push(new Point(potion.getX() + 2, potion.getY()));
                result.push(new Point(potion.getX(), potion.getY() - 2));
                result.push(new Point(potion.getX(), potion.getY() + 2));
                result.push(new Point(potion.getX() - 3, potion.getY()));
                result.push(new Point(potion.getX() + 3, potion.getY()));
                result.push(new Point(potion.getX(), potion.getY() - 3));
                result.push(new Point(potion.getX(), potion.getY() + 3));
            }
            var result2 = [];
            for (var index in result) {
                var blast = result[index];
                if (blast.isOutOf(board.size) || board.contains(board.getWalls(), blast)) {
                    continue;
                }
                result2.push(blast);
            }
            return board.removeDuplicates(result2);
        }

        function getNearExtended(x, y, scope) {
            var result = [];

            for (let i = 1; i <= scope; i++) {
                result.push(new Point(x - i, y));
                result.push(new Point(x, y + i));
                result.push(new Point(x, y - i));
                result.push(new Point(x + i, y));
            }

            let isWall = false;
            var result2 = [];
            let extraNotValidBlast = [];
            for (var index in result) {
                var blast = result[index];

                if (blast.isOutOf(board.size) || board.contains(board.getWalls(), blast) || board.contains(otherHeroes, blast) || board.contains(board.getTreasureBoxes(), blast)) {

                    ////console.log(`contains extraNotValidBlast (${blast.x},${blast.y}): ${board.contains(extraNotValidBlast, blast)}`)
                    if (board.contains(extraNotValidBlast, blast)) {
                        continue;
                    }
                    else {
                        let wallAtX = blast.x - x;
                        let wallAtY = blast.y - y;
                        let tempo = 0;

                        //si es un movimiento hacia derecha
                        if (Math.sign(wallAtX) === 1) {
                            tempo = Math.abs(wallAtX) + 1;
                            while (tempo <= scope) {
                                ////console.log(`Added (${x + tempo},${blast.y})`)
                                extraNotValidBlast.push(new Point(x + tempo, blast.y));
                                tempo++;
                            }
                        }
                        //si es un movimiento a izquierda
                        else if (Math.sign(wallAtX) === -1) {
                            tempo = Math.abs(wallAtX) + 1;
                            while (tempo <= scope) {
                                ////console.log(`Added (${x - tempo},${blast.y})`)
                                extraNotValidBlast.push(new Point(x - tempo, blast.y));
                                tempo++;
                            }
                        }
                        //si es un movimiento hacia arriba
                        else if (Math.sign(wallAtY) === 1) {
                            tempo = Math.abs(wallAtY) + 1;
                            while (tempo <= scope) {
                                ////console.log(`Added (${blast.x},${y + tempo})`)
                                extraNotValidBlast.push(new Point(blast.x, y + tempo));
                                tempo++;
                            }
                        }
                        ///si es un movimiento hacia abajo
                        else if (Math.sign(wallAtY) === -1) {
                            tempo = Math.abs(wallAtY) + 1;
                            while (tempo <= scope) {
                                ////console.log(`Added (${blast.x},${y - tempo})`)
                                extraNotValidBlast.push(new Point(blast.x, y - tempo));
                                tempo++;
                            }
                        }
                    }

                    if (blast.isOutOf(board.size) || board.contains(board.getWalls(), blast)) {
                        continue;
                    }
                }
                if (board.contains(extraNotValidBlast, blast)) {
                    continue;
                }
                ////console.log(`(${blast.x},${blast.y}) SI es parte de la explosion`)
                result2.push(board.getAt(blast.x, blast.y));
            }

            ////console.log(`(${x}, ${y}) + ${scope}`)
            //console.log('getNearExtended:', result2)
            return result2;
        }

        function getNearFields(x, y, scope) {
            var result = [];
            for (var dx = -scope; dx <= scope; dx++) {
                for (var dy = -scope; dy <= scope; dy++) {
                    if (dx == 0 && dy == 0) continue;
                    result.push(new Point(x + dx, y + dy));
                }
            }
            return result;
        }


        if (getNearExtended(posHero.x, posHero.y, 2).includes(Element.GHOST)) {
            console.log('NEAR TO GHOST!!!')
            const closestSafeField = findClosestElement(safeFieldsWithNoFutureBlast, true)

            if (Object.entries(closestSafeField).length > 0) {
                const movementToSafeZone = calculateShortestPath(closestSafeField, true)
                //console.log(`MOVER A: ${movementToSafeZone}`)
                if (movementToSafeZone[0] !== undefined) {
                    return [Direction.ACT, Direction[movementToSafeZone[0]]];
                }
            }
            else {
                console.log('No se encontro un Punto cercano')
                return Direction.ACT;
            }
        }

        const isAtfutureBlastZone = board.contains(futureBlast, new Point(posHero.x, posHero.y));

        if (isAtfutureBlastZone) {
            //move
            console.log('HERO AT BLAST ZONE, MOVE!!!')
            const closestSafeField = findClosestElement(safeFieldsWithNoFutureBlast, true)

            if (Object.entries(closestSafeField).length > 0) {
                const movementToSafeZone = calculateShortestPath(closestSafeField, true)
                //console.log(`MOVER A: ${movementToSafeZone}`)
                if (movementToSafeZone[0] !== undefined) {
                    return Direction[movementToSafeZone[0]];
                }
            }
            else {
                console.log('No se encontro un Punto cercano')
            }
        }
        else {

            if ((getNearExtended(posHero.x, posHero.y, 2).includes(Element.TREASURE_BOX)
                || getNearExtended(posHero.x, posHero.y, 4).includes(Element.GHOST)
                // || board.getNear(posHero.x, posHero.y).includes(Element.GHOST)
                || getNearExtended(posHero.x, posHero.y, 4).includes(Element.GHOST_DEAD)
                || board.getNear(posHero.x, posHero.y).includes(Element.GHOST_DEAD)
                || getNearExtended(posHero.x, posHero.y, 3).includes(Element.OTHER_HERO))
                // || getNearExtended(posHero.x, posHero.y, 3).includes(Element.ENEMY_HERO))
                && !getNearExtended(posHero.x, posHero.y, 3).includes(Element.POTION_BLAST_RADIUS_INCREASE)
                && !getNearExtended(posHero.x, posHero.y, 3).includes(Element.POTION_REMOTE_CONTROL)
                && !getNearExtended(posHero.x, posHero.y, 3).includes(Element.POTION_IMMUNE)
                && !getNearExtended(posHero.x, posHero.y, 3).includes(Element.POISON_THROWER)
                && !getNearExtended(posHero.x, posHero.y, 3).includes(Element.POTION_EXPLODER)
                && !getNearExtended(posHero.x, posHero.y, 3).includes(Element.POTION_COUNT_INCREASE)
            ) {
                console.log('LANZAR BOMBA!!')
                // let movAfterAct;
                // if (localStorage.getItem('latest_x') == posHero.x) {
                //     movAfterAct = posHero.y - localStorage.getItem('latest_y') == 1 ? 'DOWN' : 'UP';
                // }
                // else {
                //     movAfterAct = posHero.x - localStorage.getItem('latest_x') == 1 ? 'LEFT' : 'RIGHT';
                // }
                return [Direction.ACT, Direction.ACT];
            }
            else {
                const closestObjective = findClosestElement(objectives, false);

                if (Object.entries(closestObjective).length > 0) {
                    const movementToClosestObjective = calculateShortestPath(closestObjective, false)
                    //console.log(`MOVER A: ${movementToSafeZone}`)
                    if (movementToClosestObjective[0] !== undefined) {
                        console.log('closestObjective is at:', movementToClosestObjective[0])
                        return Direction[movementToClosestObjective[0]];
                    }
                }
            }

        }



        //const validateIfAtBlastPosition = validateBoomZone(nonMovementPossible);

        //const movementToSafeZone = calculateShortestPath()




        return [Direction.ACT];
    }
};
