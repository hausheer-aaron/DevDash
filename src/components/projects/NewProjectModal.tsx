import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/store'
import { useUI } from '@/store/ui'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { ProjectForm } from './ProjectForm'

/** Global "new project" modal, openable from anywhere (sidebar, palette, `n`). */
export function NewProjectModal() {
  const open = useUI((s) => s.newProjectOpen)
  const close = useUI((s) => s.closeNewProject)
  const addProject = useStore((s) => s.addProject)
  const navigate = useNavigate()
  const toast = useToast()

  return (
    <Modal
      open={open}
      onClose={close}
      title="New project"
      description="Spin up a workspace for your next idea."
      size="lg"
    >
      <ProjectForm
        onCancel={close}
        onSubmit={(values) => {
          const project = addProject(values)
          close()
          toast.success('Project created', project.name)
          navigate(`/projects/${project.id}`)
        }}
      />
    </Modal>
  )
}
