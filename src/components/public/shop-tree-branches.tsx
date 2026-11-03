'use client'

import { useEffect, useRef, useState } from 'react'
import { buildGrowth, type Growth, type GrowthNode } from '@/features/shops/tree-growth'

/**
 * Açılış ağacının dalları. Sunucu düz listeyi basar; bu bileşen düğümlerin ekrandaki yerini ölçer,
 * aralarına sivrilen mürekkep dalları çizer ve açılışta ağacı kökten büyütür: tohum yanar, gövde
 * iner, uçta bir kor ışığı yürür, dal varınca düğüm açılır, yapraklar filizlenir. Sonra dallardan
 * arada bir öz ışığı akar. Tamamen süs: ekran okuyucudan gizli, dokunmayı engellemez.
 *
 * Bu bileşen geç gelirse (yavaş telefon) büyüme oynatılmaz: dükkanlar CSS'teki yedek zamanlamayla
 * zaten açılmıştır, dallar yalnızca belirir. Azaltılmış harekette dallar baştan çizili durur.
 */

/** Sayfa açıldıktan bu kadar sonra gelinirse büyüme oynatılmaz (ms). CSS yedeğinden önce olmalı. */
const LATE_MS = 1100
/** Öz ışığının bütün ağaçta bir tur atma aralığı (ms) ve hızı (px/sn). */
const SAP_PERIOD = 7000
const SAP_SPEED = 900
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

interface Drawing {
  growth: Growth
  width: number
  height: number
  play: boolean
}

export function ShopTreeBranches() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drawing, setDrawing] = useState<Drawing | null>(null)

  // Ölç: ilk kez yazı tipleri hazır olunca, sonra boyut değiştikçe (dönüş, pencere).
  useEffect(() => {
    const svg = svgRef.current
    const container = svg?.parentElement
    if (!svg || !container) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let first = true
    let lastSize = ''

    const measure = () => {
      const base = container.getBoundingClientRect()
      const size = `${Math.round(base.width)}x${Math.round(base.height)}`
      if (size === lastSize) return
      lastSize = size
      const nodes: GrowthNode[] = []
      container.querySelectorAll<HTMLElement>('[data-tree-node]').forEach((el) => {
        const r = el.getBoundingClientRect()
        nodes.push({
          id: el.dataset.treeNode!,
          parent: el.dataset.treeParent ?? null,
          box: { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height },
        })
      })
      const growth = buildGrowth(nodes, matchMedia('(min-width: 1024px)').matches)
      if (!growth) return
      const play = first && !reduce && performance.now() < LATE_MS
      first = false
      container.closest('.tree-section')?.setAttribute('data-grown', play ? 'play' : 'still')
      setDrawing({ growth, width: base.width, height: base.height, play })
    }

    let observer: ResizeObserver | null = null
    let cancelled = false
    const ready = document.fonts?.ready ?? Promise.resolve()
    void ready.then(() => {
      if (cancelled) return
      measure()
      observer = new ResizeObserver(() => measure())
      observer.observe(container)
    })
    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [])

  // Büyüme, öz ışığı ve soy çizgisi: çizim her değiştiğinde yeniden kurulur.
  useEffect(() => {
    const svg = svgRef.current
    const container = svg?.parentElement
    if (!svg || !container || !drawing) return
    const { growth, play } = drawing
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const animations: Animation[] = []
    const run = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      animations.push(el.animate(keyframes, options))
    }
    const ms = (s: number) => s * 1000

    if (play) {
      svg.querySelectorAll('.tree-seed').forEach((el) =>
        run(
          el,
          [
            { opacity: 0, transform: 'scale(0.4)' },
            { opacity: 1, transform: 'none' },
          ],
          {
            duration: 500,
            easing: EASE_OUT,
            fill: 'backwards',
          },
        ),
      )
      growth.pieces.forEach((piece, i) => {
        const timing = {
          delay: ms(piece.start),
          duration: ms(piece.duration),
          easing: piece.easing,
        }
        svg.querySelectorAll(`[data-grow="${i}"]`).forEach((el) =>
          run(el, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
            ...timing,
            fill: 'backwards',
          }),
        )
        const tip = svg.querySelector(`[data-tip="${i}"]`)
        const head = Number(tip?.getAttribute('data-head') ?? 0)
        if (tip) {
          run(
            tip,
            [
              { strokeDashoffset: head, opacity: 1 },
              { strokeDashoffset: head - 1, opacity: piece.arrives ? 0 : 1 },
            ],
            { ...timing, fill: 'none' },
          )
        }
      })
      growth.leaves.forEach((leaf, i) => {
        const el = svg.querySelector(`[data-leaf="${i}"]`)
        if (el)
          run(
            el,
            [
              { opacity: 0, transform: 'scale(0.3)' },
              { opacity: 1, transform: 'none' },
            ],
            {
              delay: ms(leaf.at),
              duration: 700,
              easing: EASE_OUT,
              fill: 'backwards',
            },
          )
      })
      growth.buds.forEach((bud, i) => {
        const el = svg.querySelector(`[data-bud="${i}"]`)
        if (el)
          run(
            el,
            [
              { opacity: 0, transform: 'scale(0.4)' },
              { opacity: 1, transform: 'scale(1.6)', offset: 0.35 },
              { opacity: 1, transform: 'none' },
            ],
            { delay: ms(bud.at - 0.04), duration: 600, easing: EASE_OUT, fill: 'backwards' },
          )
      })
      container.querySelectorAll<HTMLElement>('[data-tree-node]').forEach((el) => {
        const at = growth.arrivals[el.dataset.treeNode!]
        if (at === undefined) return
        run(
          el,
          [
            { opacity: 0, transform: 'translate3d(-6px, 0, 0) scale(0.97)' },
            { opacity: 1, transform: 'none' },
          ],
          { delay: ms(at - 0.05), duration: 450, easing: EASE_OUT, fill: 'backwards' },
        )
      })
    } else if (!reduce) {
      run(svg, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-out' })
    }

    // Öz ışığı: kökten uçlara doğru akar, her parça kökten uzaklığı kadar gecikir. Ekran dışında durur.
    const sap: Animation[] = []
    if (!reduce) {
      const begin = play ? ms(growth.total + 0.8) : 1500
      growth.pieces.forEach((piece, i) => {
        const tip = svg.querySelector(`[data-tip="${i}"]`)
        if (!tip) return
        const head = Number(tip.getAttribute('data-head'))
        const travel = Math.min(0.9, ms(piece.length / SAP_SPEED) / SAP_PERIOD)
        const anim = tip.animate(
          [
            { offset: 0, strokeDashoffset: head, opacity: 0.85 },
            { offset: travel, strokeDashoffset: -1, opacity: 0.85 },
            { offset: 1, strokeDashoffset: -1, opacity: 0.85 },
          ],
          {
            delay: begin + ms(piece.distance / SAP_SPEED),
            duration: SAP_PERIOD,
            iterations: Infinity,
          },
        )
        sap.push(anim)
      })
    }
    const visibility = new IntersectionObserver(([entry]) => {
      sap.forEach((a) => (entry?.isIntersecting ? a.play() : a.pause()))
    })
    visibility.observe(svg)

    // Soy çizgisi: bir düğümün üstüne gelince (ya da klavyeyle odaklanınca) kökten ona giden dallar yanar.
    const lit = svg.querySelectorAll<SVGElement>('.tree-lit')
    const light = (id: string | null) =>
      lit.forEach((el) =>
        el.classList.toggle('is-lit', !!id && el.dataset.feeds!.split(' ').includes(id)),
      )
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
    const nodeOf = (e: Event) =>
      (e.target as Element | null)?.closest<HTMLElement>('[data-tree-node]')?.dataset.treeNode ??
      null
    const over = (e: Event) => fine && light(nodeOf(e))
    const out = () => light(null)
    const focus = (e: Event) => light(nodeOf(e))
    container.addEventListener('pointerover', over)
    container.addEventListener('pointerleave', out)
    container.addEventListener('focusin', focus)
    container.addEventListener('focusout', out)

    return () => {
      animations.forEach((a) => a.cancel())
      sap.forEach((a) => a.cancel())
      visibility.disconnect()
      container.removeEventListener('pointerover', over)
      container.removeEventListener('pointerleave', out)
      container.removeEventListener('focusin', focus)
      container.removeEventListener('focusout', out)
    }
  }, [drawing])

  const growth = drawing?.growth
  return (
    <svg
      ref={svgRef}
      className="tree-branches"
      width={drawing?.width ?? 0}
      height={drawing?.height ?? 0}
      viewBox={drawing ? `0 0 ${drawing.width} ${drawing.height}` : undefined}
      aria-hidden
      focusable="false"
    >
      {drawing && growth ? (
        <>
          <defs>
            {/* Kök tarafı markanın kehribarıyla yanar, uçlara doğru eski mürekkep rengine söner. */}
            <linearGradient
              id="tree-bark"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={growth.seed.y}
              x2="0"
              y2={drawing.height}
            >
              <stop offset="0" stopColor="var(--brand)" />
              <stop offset="0.35" stopColor="#e0cda4" stopOpacity="0.78" />
              <stop offset="1" stopColor="#a89d86" stopOpacity="0.6" />
            </linearGradient>
            {growth.pieces.map((piece, i) => (
              <mask
                key={i}
                id={`tree-grow-${i}`}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={drawing.width}
                height={drawing.height}
              >
                <path
                  data-grow={i}
                  d={piece.d}
                  pathLength={1}
                  className="tree-mask"
                  strokeWidth={piece.width + 8}
                />
              </mask>
            ))}
          </defs>
          {growth.pieces.map((piece, i) => (
            <g key={i} mask={`url(#tree-grow-${i})`}>
              <path d={piece.outline} className="tree-bark" />
              <path d={piece.outline} className="tree-lit" data-feeds={piece.feeds.join(' ')} />
            </g>
          ))}
          {growth.leaves.map((leaf, i) => (
            <g key={i} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}>
              <path data-leaf={i} className="tree-leaf-shape" d={leafPath(leaf.size)} />
            </g>
          ))}
          {growth.pieces.map((piece, i) => {
            const head = Math.min(0.35, 16 / Math.max(1, piece.length))
            return (
              <path
                key={i}
                data-tip={i}
                data-head={head}
                d={piece.d}
                pathLength={1}
                className="tree-tip"
                strokeDasharray={`${head} 3`}
                strokeDashoffset={head}
              />
            )
          })}
          {growth.buds.map((bud, i) => (
            <circle key={i} data-bud={i} className="tree-bud" cx={bud.x} cy={bud.y} r={2.2} />
          ))}
          <g className="tree-seed">
            <circle cx={growth.seed.x} cy={growth.seed.y} r={10} className="tree-seed-halo" />
            <circle cx={growth.seed.x} cy={growth.seed.y} r={3.6} className="tree-seed-core" />
          </g>
        </>
      ) : null}
    </svg>
  )
}

/** Badem yaprağı: sapı (0,0)'da, ucu sağda; ortasından ince bir damar geçer. */
function leafPath(size: number) {
  const s = size
  return `M0 0C${s * 0.3} ${-s * 0.42} ${s * 0.78} ${-s * 0.34} ${s} 0C${s * 0.78} ${s * 0.34} ${s * 0.3} ${s * 0.42} 0 0Z`
}
