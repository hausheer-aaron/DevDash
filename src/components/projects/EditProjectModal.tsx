import { useStore } from '@/store/store'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { ProjectForm } from './ProjectForm'
import type { Project } from '@/types'

interface EditProjectModalProps {
  project: Project | null
  open: boolean
  onClose: () => void
}

export function EditProjectModal({ project, open, onClose }: EditProjectModalProps) {
  const updateProject = useStore((s) => s.updateProject)
  const toast = useToast()

  return (
    <Modal open={open && !!project} onClose={onClose} title="Edit project" size="lg">
      {project && (
        <ProjectForm
          initial={project}
          submitLabel="Save changes"
          onCancel={onClose}
          onSubmit={async (values) => {
            await updateProject(project.id, values)
            onClose()
            toast.success('Project updated')
          }}
        />
      )}
    </Modal>
  )
}
