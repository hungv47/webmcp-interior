'use client'

import {
  emitter,
  sceneRegistry,
  useScene,
  type AnyNodeId,
  type CameraControlEvent,
  type CameraControlFitSceneEvent,
} from '@aedifex/core'
import { snapLevelsToTruePositions } from '@aedifex/viewer'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Box3, Vector3 } from 'three'

type Pose = {
  position: [number, number, number]
  target: [number, number, number]
}

function asTuple(value: unknown): [number, number, number] | null {
  if (!Array.isArray(value) || value.length < 3) return null
  const x = Number(value[0])
  const y = Number(value[1])
  const z = Number(value[2])
  if (![x, y, z].every(Number.isFinite)) return null
  return [x, y, z]
}

function readStoredCamera(node: unknown): Pose | null {
  if (!node || typeof node !== 'object') return null
  const camera = (node as { camera?: { position?: unknown; target?: unknown } }).camera
  if (!camera) return null
  const position = asTuple(camera.position)
  const target = asTuple(camera.target)
  if (!position || !target) return null
  return { position, target }
}

function buildingWorldOffset(nodeId: string): [number, number, number] {
  const nodes = useScene.getState().nodes
  let current = nodes[nodeId as AnyNodeId]
  while (current) {
    if (current.type === 'building') {
      return asTuple((current as { position?: unknown }).position) ?? [0, 0, 0]
    }
    current = current.parentId ? nodes[current.parentId as AnyNodeId] : undefined
  }
  return [0, 0, 0]
}

function shiftPose(pose: Pose, offset: [number, number, number]): Pose {
  if (offset[0] === 0 && offset[1] === 0 && offset[2] === 0) return pose
  return {
    position: [
      pose.position[0] + offset[0],
      pose.position[1] + offset[1],
      pose.position[2] + offset[2],
    ],
    target: [pose.target[0] + offset[0], pose.target[1] + offset[1], pose.target[2] + offset[2]],
  }
}

function wallFitPose(): Pose | null {
  // Use stored camera from ground level instead of computed fit
  return initialPose()
}

function objectFitPose(nodeId: string): Pose | null {
  const object = sceneRegistry.nodes.get(nodeId)
  if (!object) return null
  const box = new Box3().setFromObject(object)
  if (box.isEmpty()) return null
  const center = box.getCenter(new Vector3())
  const size = box.getSize(new Vector3())
  const maxExtent = Math.max(size.x, size.y, size.z)
  const distance = Math.max(maxExtent * 1.4, 15)
  const height = Math.max(maxExtent * 0.8, 10)
  return {
    position: [center.x + distance * 0.7, center.y + height * 0.5, center.z + distance * 0.7],
    target: [center.x, center.y, center.z],
  }
}

function poseForNode(nodeId: string): Pose | null {
  const nodes = useScene.getState().nodes
  const node = nodes[nodeId as AnyNodeId]
  const offset = buildingWorldOffset(nodeId)
  const stored = readStoredCamera(node)
  if (stored) return shiftPose(stored, offset)

  if (node?.type === 'building') {
    const children = (node as { children?: string[] }).children ?? []
    for (const childId of children) {
      const camera = readStoredCamera(nodes[childId as AnyNodeId])
      if (camera) return shiftPose(camera, offset)
    }
  }

  return objectFitPose(nodeId) ?? wallFitPose()
}

function initialPose(): Pose | null {
  const nodes = useScene.getState().nodes
  const levels = Object.values(nodes).filter((node) => node?.type === 'level')
  const ground = levels.find((node) => (node as { level?: number }).level === 0) ?? levels[0]
  if (ground) {
    const pose = poseForNode(ground.id)
    if (pose) return pose
  }
  return wallFitPose()
}

function applyPose(controls: CameraControlsImpl, pose: Pose, smooth: boolean) {
  controls.setLookAt(
    pose.position[0],
    pose.position[1],
    pose.position[2],
    pose.target[0],
    pose.target[1],
    pose.target[2],
    smooth,
  )
}

export function FrameRoomCamera() {
  const controls = useRef<CameraControlsImpl | null>(null)
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)

  const frameInitial = () => {
    const control = controls.current
    if (!control) return false
    const pose = initialPose()
    if (!pose) return false
    applyPose(control, pose, false)
    invalidate()
    return true
  }

  useLayoutEffect(() => {
    const waitForLevels = () => {
      return new Promise<boolean>((resolve) => {
        const checkLevels = () => {
          const hasLevels = sceneRegistry.byType.level && sceneRegistry.byType.level.size > 0
          if (hasLevels) {
            let hasObjects = true
            sceneRegistry.byType.level.forEach((levelId) => {
              if (!sceneRegistry.nodes.get(levelId)) {
                hasObjects = false
              }
            })
            if (hasObjects) {
              resolve(true)
              return
            }
          }
          requestAnimationFrame(checkLevels)
        }
        checkLevels()
      })
    }

    waitForLevels().then(() => {
      snapLevelsToTruePositions()
      console.log('[FrameRoomCamera] Snapped levels to stacked positions')
      
      const pose = initialPose()
      if (pose) {
        camera.position.set(pose.position[0], pose.position[1], pose.position[2])
        camera.lookAt(pose.target[0], pose.target[1], pose.target[2])
        camera.updateProjectionMatrix()
      }

      if (frameInitial()) return
      let attempts = 0
      let frame = 0
      const retry = () => {
        attempts += 1
        if (frameInitial() || attempts > 30) return
        frame = window.requestAnimationFrame(retry)
      }
      frame = window.requestAnimationFrame(retry)
    })

    // First mount only: this is the empty-sky fix, not a reactive tracker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const lookAtNode = ({ nodeId }: CameraControlEvent) => {
      const control = controls.current
      if (!control) return
      const pose = poseForNode(nodeId)
      if (!pose) return
      applyPose(control, pose, true)
      invalidate()
    }

    const handleFit = ({ bounds }: CameraControlFitSceneEvent) => {
      const control = controls.current
      if (!control) return
      
      // Always use stored camera pose, ignore computed bounds
      const pose = wallFitPose()
      if (pose) {
        applyPose(control, pose, true)
        invalidate()
      }
    }

    emitter.on('camera-controls:view', lookAtNode)
    emitter.on('camera-controls:focus', lookAtNode)
    emitter.on('camera-controls:fit-scene', handleFit)
    return () => {
      emitter.off('camera-controls:view', lookAtNode)
      emitter.off('camera-controls:focus', lookAtNode)
      emitter.off('camera-controls:fit-scene', handleFit)
    }
  }, [invalidate])

  return (
    <CameraControls
      makeDefault
      maxDistance={120}
      maxPolarAngle={Math.PI / 2}
      minDistance={2}
      minPolarAngle={0}
      ref={controls}
    />
  )
}
