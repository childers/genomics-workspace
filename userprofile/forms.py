from django import forms
from django.contrib.auth.forms import PasswordChangeForm
from django.utils.translation import ugettext, ugettext_lazy as _
from .models import Profile

class BootStrapPasswordChangeForm(PasswordChangeForm):
    old_password = forms.CharField(label=_("Old password"),
                                   widget=forms.PasswordInput({
                                       'class':'form-control',
                                       'placeholder': 'Old password',
                                   })
                                  )
    new_password1 = forms.CharField(label=_("New password"),
                                    widget=forms.PasswordInput({
                                        'class':'form-control',
                                        'placeholder': 'New password',
                                    })
                                   )
    new_password2 = forms.CharField(label=_("New password confirmation"),
                                    widget=forms.PasswordInput({
                                        'class':'form-control',
                                        'placeholder': 'New password',
                                    })
                                  ) 
class InfoChangeForm(forms.ModelForm):
    first_name = forms.CharField(label=_(u'First name'), max_length=30, required=True)
    last_name = forms.CharField(label=_(u'Last name'), max_length=30, required=True)
    email = forms.EmailField(label=_(u'Email'),required=True)
    institution = forms.CharField(label=_(u'Institution'),required=True)

    class Meta:
        model = Profile
        fields = ['first_name', 'last_name', 'email', 'institution']
    
    def __init__(self, *args, **kw):
        super(InfoChangeForm, self).__init__(*args, **kw)
        self.fields['first_name'].initial = self.instance.user.first_name
        self.fields['first_name'].widget.attrs.update({'class' : 'form-control'})
        self.fields['last_name'].initial = self.instance.user.last_name
        self.fields['last_name'].widget.attrs.update({'class' : 'form-control'})
        self.fields['email'].initial = self.instance.user.email
        self.fields['email'].widget.attrs.update({'class' : 'form-control'})
        self.fields['institution'].initial = self.instance.institution
        self.fields['institution'].widget.attrs.update({'class' : 'form-control'})

    def save(self, *args, **kw):
        super(InfoChangeForm, self).save(*args, **kw)
        self.instance.user.first_name = self.cleaned_data.get('first_name')
        self.instance.user.last_name = self.cleaned_data.get('last_name')
        self.instance.user.email = self.cleaned_data.get('email')
        self.instance.user.save()
        self.instance.institution = self.cleaned_data.get('institution')
        self.instance.save()
