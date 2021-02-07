import React from 'react'
import { Board, Point, SolveResult } from '../core/types'
import * as solve from '../core/solve'
import { Button } from '@material-ui/core'
import { actorColor, eliminationColor, setValueColor } from '../theme'

export type SolverProps = {
    board: Board
    solveResult: SolveResult | null
    onSolveResult: (solveResult: SolveResult | null, prevBoard: Board) => void
    onPlayFromHere: () => void
}

const pointToStr = (point: Point) => `r${point.y+1}c${point.x+1}`

export const Solver = (props: SolverProps) => {
    const {board, solveResult, onSolveResult} = props
    const [skippedTechniques, setSkippedTechniques] = React.useState<string[]>([])

    const onToggleTechnique = React.useCallback((type: string) => {
        setSkippedTechniques(s => {
            if(s.some(t => t === type)){
                return s.filter(t => t !== type)
            }else{
                return [...s, type]
            }
        })
    }, [])

    const iterate = React.useCallback(() => {
        let boardBeforeSolve = board
        let res = solve.iterate(boardBeforeSolve)
        while(res !== null && skippedTechniques.includes(res.technique)){
            boardBeforeSolve = res.board
            res = solve.iterate(boardBeforeSolve)
        }
        onSolveResult(res, boardBeforeSolve)
    }, [board, skippedTechniques, onSolveResult])

    return (
        <div>
            <h3>Solver</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button color='primary' variant='outlined' fullWidth onClick={props.onPlayFromHere}>Play from here</Button>
            </div>
            <br />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button color='primary' variant='contained' fullWidth onClick={iterate}>Iterate</Button>
            </div>
            {solveResult && solveResult.technique !== 'done' &&
            <div>
                <i>Technique:</i>
                <br />
                {solveResult.technique}
                <br />
                <i>Actors:</i>
                <br />
                <span style={{ background: actorColor }}>&nbsp;&nbsp;</span>
                {solveResult.actors.map((actor, i) => {
                    return (
                        <span key={i}>{' '}
                            {pointToStr(actor.point)}
                            {actor.cand && `[${actor.cand}]`}
                            {actor.chainSet && `${actor.chainSet === 'yes' ? 'T' : 'F'}`}
                        </span>
                    )
                })}
                <br />
                <i>Effects:</i>
                {solveResult.effects.map((effect, i) => {
                    return (
                        <div key={i}>
                            {effect.type === 'elimination' &&
                            <div>
                                <span style={{ background: eliminationColor }}>&nbsp;&nbsp;</span>
                                Eliminate {effect.numbers.join(',')} from {pointToStr(effect.point)}
                            </div>
                            }
                            {effect.type === 'value' &&
                            <div>
                                <span style={{ background: setValueColor }}>&nbsp;&nbsp;</span>
                                Set {effect.number} at {pointToStr(effect.point)}
                            </div>
                            }
                        </div>
                    )
                })}
            </div>
            }
            <div>
                <h4>Skip techniques</h4>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                {solve.techniques.map(tech => {
                    const skipped = skippedTechniques.some(t => t === tech.type)
                    return (
                        <Button
                            key={tech.type}
                            size='small'
                            color='default'
                            fullWidth={true}
                            variant='outlined'
                            style={{color: skipped ? 'red' : ''}}
                            onClick={() => onToggleTechnique(tech.type)}
                        >
                            {tech.type}
                        </Button>
                    )
                })}
                </div>
            </div>
        </div>
    )
}