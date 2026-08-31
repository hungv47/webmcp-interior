import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { configureKtx2Support } from '../lib/ktx2-loader'

let dracoLoader: DRACOLoader | null = null

const useGLTFKTX2 = (path: string): ReturnType<typeof useGLTF> => {
  const gl = useThree((state) => state.gl)

  return useGLTF(path, true, true, (loader) => {
    configureKtx2Support(loader, gl)
    if (!dracoLoader) {
      dracoLoader = new DRACOLoader(loader.manager)
      dracoLoader.setDecoderPath('/draco/')
    }
    loader.setDRACOLoader(dracoLoader as any)
    loader.setMeshoptDecoder(MeshoptDecoder)
  })
}

export { useGLTFKTX2 }
