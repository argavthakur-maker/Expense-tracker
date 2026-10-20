declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (params: {
            client_id: string
            callback: (credential: any) => void
            auto_select?: boolean
            context?: string
            theme?: string
            type?: string
            use_fedcm_for_prompt?: boolean
          }) => void
          renderButton: (element: HTMLElement, options: {
            size: string
            theme: string
            text: string
          }) => void
        }
      }
    }
  }
}