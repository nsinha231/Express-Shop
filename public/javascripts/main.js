$(document).on('click', '[data-toggle="lightbox"]', function (event) {
  event.preventDefault();
  $(this).ekkoLightbox();
});

$(document).ready(function () {
  $('#profileForm :input').prop('disabled', true);
  $('#editProfile').prop('disabled', false);
  $('#deletebutton').prop('disabled', false);
  $('#submitProfile').hide();
  $('#avatar').hide();
  $('#editProfile').click(function () {
    if (this.value == 'Edit Profile') {
      this.value = 'Cancel';
      $('#profileForm :input').prop('disabled', false);
      $('#editProfile').prop('disabled', false);
      $('#deletebutton').prop('disabled', false);
      $('#submitProfile').show();
      $('#avatar').show();
    } else {
      this.value = 'Edit Profile';
      $('#profileForm :input').prop('disabled', true);
      $('#editProfile').prop('disabled', false);
      $('#deletebutton').prop('disabled', false);
      $('#submitProfile').hide();
      $('#avatar').hide();
    }
  });
});

$('#thumbnail').change(function (e) {
  if (e.target.files.length) {
    if (typeof FileReader != 'undefined') {
      let thumbnailPreview = $('#thumbnailPreview');
      thumbnailPreview.html('');
      $(this).next('.custom-file-label').html(e.target.files[0].name);
      let reader = new FileReader();
      let file = e.target.files[0];
      reader.onload = function (e) {
        let col = $("<div class='col-sm-5 col-md-4 col-lg-3 mb-3'></div>");
        let anchor = $("<a data-toggle='lightbox' data-gallery='gallery'></a>");
        let img = $("<img class='d-block w-100'/>");
        img.attr('src', e.target.result);
        anchor.attr('href', e.target.result);
        anchor.append(img);
        col.append(anchor);
        thumbnailPreview.append(col);
      };
      reader.readAsDataURL(file);
    } else {
      alert('This browser does not support HTML5 FileReader.');
    }
  } else {
    $(this).next('.custom-file-label').html('Choose Thumbnail');
  }
});

$('#photos').change(function (e) {
  if (e.target.files.length > 6) {
    alert('You can select only 6 Photos');
    $(this).next('.custom-file-label').html('Choose Photos');
    $(this).val('');
  } else if (e.target.files.length > 0 && e.target.files.length < 6) {
    if (typeof FileReader != 'undefined') {
      let preview = $('#preview');
      preview.html('');
      $(this)
        .next('.custom-file-label')
        .html(
          `${e.target.files[0].name} and ${e.target.files.length - 1} more `
        );
      $($(this)[0].files).each(function () {
        let file = $(this);
        let reader = new FileReader();
        reader.onload = function (e) {
          let col = $("<div class='col-sm-5 col-md-4 col-lg-3 mb-3'></div>");
          let anchor = $(
            "<a data-toggle='lightbox' data-gallery='gallery'></a>"
          );
          let img = $("<img class='d-block w-100'/>");
          img.attr('src', e.target.result);
          anchor.attr('href', e.target.result);
          anchor.append(img);
          col.append(anchor);
          preview.append(col);
        };
        reader.readAsDataURL(file[0]);
      });
    } else {
      alert('This browser does not support HTML5 FileReader.');
    }
  } else {
    $(this).next('.custom-file-label').html('Choose Photos');
  }
});
