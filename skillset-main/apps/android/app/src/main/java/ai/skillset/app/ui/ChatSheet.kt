package ai.skillset.app.ui

import androidx.compose.runtime.Composable
import ai.skillset.app.MainViewModel
import ai.skillset.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
